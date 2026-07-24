const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {loadOrGenerateKeys} = require("./utils/key-manager");
const dotenv = require('dotenv');
const ROLES = require("./config/roles");

function createApp(root) {
    const server = jsonServer.create();

    const path = require('path');
    const jwt = require('jsonwebtoken');
    const crypto = require('crypto');
    const dotenv = require('dotenv');

    const {loadOrGenerateKeys} = require('./utils/key-manager');

    dotenv.config();

    const dbPath = path.join(root, 'db.json');

    const db = require(dbPath);

    configureRealm(db);

    const router = jsonServer.router(db);

    const middlewares = jsonServer.defaults({
        noCors: false
    });

    const rewriter = jsonServer.rewriter(
        require(path.join(root, 'routes.json'))
    );

    // ==========================================
    // JWT
    // ==========================================

    const KID = 'mock-kid';

    const {privateKey, publicKey} = loadOrGenerateKeys(root);

    const publicKeyObject = crypto.createPublicKey(publicKey);

    const jwk = publicKeyObject.export({format: 'jwk'});

    // ==========================================
    // MIDDLEWARES
    // ==========================================

    server.use(middlewares);

    // ==========================================
    // JWKS - CHAVE PÚBLICA
    // ==========================================

    server.get(
        '/auth/realms/:realm/protocol/openid-connect/certs',
        (req, res) => {

            console.log('>>> GET /certs');

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

    // ==========================================
    // TOKEN
    // ==========================================

    const ROLES = require('./config/roles');

    server.post(
        '/auth/realms/:realm/protocol/openid-connect/token',
        (req, res) => {

            const MOCK_KEYCLOAK_REALM = process.env.MOCK_KEYCLOAK_REALM;
            const MOCK_KEYCLOAK_URL = process.env.MOCK_KEYCLOAK_URL;

            const requestedRealm = req.params.realm;

            console.log('>>> POST /token');

            if (requestedRealm !== MOCK_KEYCLOAK_REALM) {
                console.log(`❌ Realm não encontrado: ${requestedRealm}`);
                return res.status(404).json({error: 'Realm not found'});
            }

            console.log('>>> Realm configurado:', MOCK_KEYCLOAK_REALM);

            const issuer = `${MOCK_KEYCLOAK_URL}/auth/realms/${MOCK_KEYCLOAK_REALM}`;

            const accessToken = jwt.sign(
                {
                    sub: process.env.MOCK_USER_SUB,
                    preferred_username: process.env.MOCK_USER_USERNAME,
                    email: process.env.MOCK_USER_EMAIL,
                    realm_access: {
                        roles: ROLES
                    }
                },
                privateKey,
                {
                    algorithm: 'RS256',
                    keyid: KID,
                    issuer: issuer,
                    expiresIn: process.env.MOCK_ACCESS_TOKEN_EXPIRES_IN
                }
            );

            const refreshToken = jwt.sign(
                {
                    sub: process.env.MOCK_USER_SUB,
                    preferred_username:
                    process.env.MOCK_USER_USERNAME,
                    type: 'refresh'
                },
                privateKey,
                {
                    algorithm: 'RS256',
                    keyid: KID,
                    issuer: issuer,
                    expiresIn: '30d'
                }
            );

            return res.status(200).json({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_expires_in: 2592000,
                scope: 'openid profile email'
            });
        }
    );

    // ==========================================
    // AUTH
    // ==========================================

    server.get(
        '/auth/realms/:realm/protocol/openid-connect/auth',
        (req, res) => {

            return res.sendFile(
                path.join(root, 'login.html')
            );
        }
    );

    // ==========================================
    // LOGOUT
    // ==========================================

    server.get(
        '/auth/realms/:realm/protocol/openid-connect/logout',
        (req, res) => {

            const redirect =
                req.query.post_logout_redirect_uri ||
                req.query.redirect_uri;

            if (redirect) {
                return res.redirect(302, redirect);
            }

            return res.status(204).end();
        }
    );

    // ==========================================
    // REGISTRATION
    // ==========================================

    server.use((req, res, next) => {

        if (
            req.method === 'POST' &&
            req.url.includes('/registrations')
        ) {
            return res
                .status(201)
                .json({
                    message:
                        'User registered successfully (Mock)'
                });
        }

        next();
    });

    // ==========================================
    // JSON SERVER
    // SEMPRE POR ÚLTIMO
    // ==========================================

    server.use(rewriter);

    server.use(router);

    return server;
}

function configureRealm(db) {
    const realm = process.env.MOCK_KEYCLOAK_REALM;
    const baseUrl = process.env.MOCK_KEYCLOAK_URL;

    if (!realm) {
        throw new Error(
            'MOCK_KEYCLOAK_REALM não foi definido no .env'
        );
    }

    const realmBaseUrl = `${baseUrl}/auth/realms/${realm}`;

    db['openid-configuration'] = {
        ...db['openid-configuration'],
        issuer: realmBaseUrl,
        authorization_endpoint: `${realmBaseUrl}/protocol/openid-connect/auth`,
        token_endpoint: `${realmBaseUrl}/protocol/openid-connect/token`,
        userinfo_endpoint: `${realmBaseUrl}/protocol/openid-connect/userinfo`,
        end_session_endpoint: `${realmBaseUrl}/protocol/openid-connect/logout`,
        jwks_uri: `${realmBaseUrl}/protocol/openid-connect/certs`
    };

    db['realm-info'] = {
        ...db['realm-info'],
        realm: realm,
        'token-service':
            `${realmBaseUrl}/protocol/openid-connect`,
        'account-service':
            `${realmBaseUrl}/account`
    };

    return db;
}

module.exports = createApp;
