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

    dotenv.config();

    const router = jsonServer.router(
        path.join(root, 'db.json')
    );

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

            console.log('>>> POST /token');

            const realm = req.params.realm;

            const issuer =
                `http://localhost:9090/auth/realms/${realm}`;

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
                    sub: '123456',
                    preferred_username: 'daniel',
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

            const response = {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_expires_in: 2592000,
                scope: 'openid profile email'
            };

            console.log(
                '>>> Token response:',
                response
            );

            return res.status(200).json(response);
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

module.exports = createApp;
