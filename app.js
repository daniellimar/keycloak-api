const jsonServer = require('json-server');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');

const { loadOrGenerateKeys } = require('./utils/key-manager');
const ROLES = require('./config/roles');

dotenv.config();

const KID = 'mock-kid';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

function createApp(root) {
    const server = jsonServer.create();

    const config = loadConfig();
    const db = loadDatabase(root);

    configureRealm(db, config);

    const router = jsonServer.router(db);
    const rewriter = createRewriter(root);
    const middlewares = createMiddlewares();

    const keys = createJwtKeys(root);

    registerMiddlewares(server, middlewares);
    registerJwksRoute(server, keys.jwk);
    registerTokenRoute(server, keys.privateKey, config);
    registerAuthRoute(server, root);
    registerLogoutRoute(server);
    registerRegistrationRoute(server);

    server.use(rewriter);
    server.use(router);

    return server;
}

/**
 * Carrega as configurações da aplicação.
 */
function loadConfig() {
    const {
        MOCK_KEYCLOAK_REALM,
        MOCK_KEYCLOAK_URL,
        MOCK_USER_SUB,
        MOCK_USER_USERNAME,
        MOCK_USER_EMAIL,
        MOCK_ACCESS_TOKEN_EXPIRES_IN
    } = process.env;

    if (!MOCK_KEYCLOAK_REALM) {
        throw new Error(
            'A variável MOCK_KEYCLOAK_REALM não foi definida no arquivo .env'
        );
    }

    if (!MOCK_KEYCLOAK_URL) {
        throw new Error(
            'A variável MOCK_KEYCLOAK_URL não foi definida no arquivo .env'
        );
    }

    return {
        realm: MOCK_KEYCLOAK_REALM,
        baseUrl: MOCK_KEYCLOAK_URL,
        user: {
            sub: MOCK_USER_SUB,
            username: MOCK_USER_USERNAME,
            email: MOCK_USER_EMAIL
        },
        accessTokenExpiresIn:
            MOCK_ACCESS_TOKEN_EXPIRES_IN || '1h'
    };
}

/**
 * Carrega o banco de dados JSON.
 */
function loadDatabase(root) {
    const dbPath = path.join(root, 'db.json');

    return require(dbPath);
}

/**
 * Cria o rewriter do JSON Server.
 */
function createRewriter(root) {
    const routesPath = path.join(root, 'routes.json');

    return jsonServer.rewriter(
        require(routesPath)
    );
}

/**
 * Configura os middlewares padrão do JSON Server.
 */
function createMiddlewares() {
    return jsonServer.defaults({
        noCors: false
    });
}

/**
 * Carrega ou gera as chaves RSA utilizadas para assinar os JWTs.
 */
function createJwtKeys(root) {
    const {
        privateKey,
        publicKey
    } = loadOrGenerateKeys(root);

    const publicKeyObject = crypto.createPublicKey(publicKey);

    const jwk = publicKeyObject.export({
        format: 'jwk'
    });

    return {
        privateKey,
        publicKey,
        jwk
    };
}

/**
 * Registra os middlewares padrão.
 */
function registerMiddlewares(server, middlewares) {
    server.use(middlewares);
}

/**
 * Endpoint JWKS.
 *
 * Retorna a chave pública utilizada pelos clientes
 * para validar os tokens JWT.
 */
function registerJwksRoute(server, jwk) {
    server.get(
        '/auth/realms/:realm/protocol/openid-connect/certs',
        (req, res) => {
            console.log(
                '>>> GET /auth/realms/:realm/protocol/openid-connect/certs'
            );

            return res.json({
                keys: [
                    {
                        ...jwk,
                        kid: KID,
                        alg: 'RS256',
                        use: 'sig'
                    }
                ]
            });
        }
    );
}

/**
 * Endpoint de emissão de tokens.
 */
function registerTokenRoute(server, privateKey, config) {
    server.post(
        '/auth/realms/:realm/protocol/openid-connect/token',
        (req, res) => {
            const requestedRealm = req.params.realm;

            console.log(
                '>>> POST /auth/realms/:realm/protocol/openid-connect/token'
            );

            if (requestedRealm !== config.realm) {
                console.log(
                    `❌ Realm não encontrado: ${requestedRealm}`
                );

                return res.status(404).json({
                    error: 'Realm not found'
                });
            }

            console.log(
                `>>> Realm configurado: ${config.realm}`
            );

            const issuer = buildRealmUrl(
                config.baseUrl,
                config.realm
            );

            const accessToken = generateAccessToken(
                privateKey,
                issuer,
                config
            );

            const refreshToken = generateRefreshToken(
                privateKey,
                issuer,
                config
            );

            return res.status(200).json({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: config.accessTokenExpiresIn,
                refresh_expires_in: 2592000,
                scope: 'openid profile email'
            });
        }
    );
}

/**
 * Gera o Access Token JWT.
 */
function generateAccessToken(privateKey, issuer, config) {
    return jwt.sign(
        {
            sub: config.user.sub,
            preferred_username: config.user.username,
            email: config.user.email,
            realm_access: {
                roles: ROLES
            }
        },
        privateKey,
        {
            algorithm: 'RS256',
            keyid: KID,
            issuer,
            expiresIn: config.accessTokenExpiresIn
        }
    );
}

/**
 * Gera o Refresh Token JWT.
 */
function generateRefreshToken(privateKey, issuer, config) {
    return jwt.sign(
        {
            sub: config.user.sub,
            preferred_username: config.user.username,
            type: 'refresh'
        },
        privateKey,
        {
            algorithm: 'RS256',
            keyid: KID,
            issuer,
            expiresIn: REFRESH_TOKEN_EXPIRES_IN
        }
    );
}

/**
 * Endpoint de autenticação.
 *
 * Simula a tela de login do Keycloak.
 */
function registerAuthRoute(server, root) {
    server.get(
        '/auth/realms/:realm/protocol/openid-connect/auth',
        (req, res) => {
            return res.sendFile(
                path.join(root, 'login.html')
            );
        }
    );
}

/**
 * Endpoint de logout.
 */
function registerLogoutRoute(server) {
    server.get(
        '/auth/realms/:realm/protocol/openid-connect/logout',
        (req, res) => {
            const redirect =
                req.query.post_logout_redirect_uri ||
                req.query.redirect_uri;

            if (redirect) {
                return res.redirect(
                    302,
                    redirect
                );
            }

            return res.status(204).end();
        }
    );
}

/**
 * Mock do endpoint de registro de usuário.
 */
function registerRegistrationRoute(server) {
    server.use((req, res, next) => {
        const isRegistrationRequest =
            req.method === 'POST' &&
            req.url.includes('/registrations');

        if (!isRegistrationRequest) {
            return next();
        }

        return res.status(201).json({
            message: 'User registered successfully (Mock)'
        });
    });
}

/**
 * Configura os endpoints de descoberta do OpenID Connect
 * e informações do Realm.
 */
function configureRealm(db, config) {
    const realmBaseUrl = buildRealmUrl(
        config.baseUrl,
        config.realm
    );

    db['openid-configuration'] = {
        ...db['openid-configuration'],

        issuer: realmBaseUrl,

        authorization_endpoint:
            `${realmBaseUrl}/protocol/openid-connect/auth`,

        token_endpoint:
            `${realmBaseUrl}/protocol/openid-connect/token`,

        userinfo_endpoint:
            `${realmBaseUrl}/protocol/openid-connect/userinfo`,

        end_session_endpoint:
            `${realmBaseUrl}/protocol/openid-connect/logout`,

        jwks_uri:
            `${realmBaseUrl}/protocol/openid-connect/certs`
    };

    db['realm-info'] = {
        ...db['realm-info'],

        realm: config.realm,

        'token-service':
            `${realmBaseUrl}/protocol/openid-connect`,

        'account-service':
            `${realmBaseUrl}/account`
    };

    return db;
}

/**
 * Monta a URL base do Realm.
 */
function buildRealmUrl(baseUrl, realm) {
    return `${baseUrl}/auth/realms/${realm}`;
}

module.exports = createApp;
