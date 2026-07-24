const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadOrGenerateKeys(root) {
    const keysDir = path.join(root, 'keys');

    const privateKeyPath = path.join(
        keysDir,
        'private.pem'
    );

    const publicKeyPath = path.join(
        keysDir,
        'public.pem'
    );

    if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, {
            recursive: true
        });
    }

    if (
        fs.existsSync(privateKeyPath) &&
        fs.existsSync(publicKeyPath)
    ) {
        console.log('🔑 Carregando chaves RSA existentes');

        return {
            privateKey: fs.readFileSync(
                privateKeyPath
            ),

            publicKey: fs.readFileSync(
                publicKeyPath
            )
        };
    }

    console.log('🔑 Gerando novo par de chaves RSA...');

    const {
        privateKey,
        publicKey
    } = crypto.generateKeyPairSync(
        'rsa',
        {
            modulusLength: 2048,

            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },

            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        }
    );

    fs.writeFileSync(
        privateKeyPath,
        privateKey
    );

    fs.writeFileSync(
        publicKeyPath,
        publicKey
    );

    console.log(`🔑 Chaves criadas em: ${keysDir}`);

    return {
        privateKey,
        publicKey
    };
}

module.exports = {
    loadOrGenerateKeys
};
