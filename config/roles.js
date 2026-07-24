const config = require('./config.json');
const dotenv = require('dotenv');

dotenv.config();

const ROLES = [];

const sistema = config.sistema;
const MOCK_PERFIL = process.env.MOCK_PERFIL?.trim();

sistema.modulos.forEach(modulo => {
    if (modulo.status?.toLowerCase() !== 'ativo') {
        return;
    }

    modulo.funcionalidade.forEach(funcionalidade => {
        if (funcionalidade.status?.toLowerCase() !== 'ativo') {
            return;
        }

        const pertenceAoPerfil = funcionalidade.grupos?.some(
            grupo => grupo.trim() === MOCK_PERFIL
        );

        if (!pertenceAoPerfil) {
            return;
        }

        const role = [
            'ROLE',
            sistema.mnemonico,
            modulo.mnemonico,
            funcionalidade.mnemonico
        ]
            .join('_')
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .toUpperCase();

        if (!ROLES.includes(role)) {
            ROLES.push(role);
        }
    });
});

module.exports = ROLES;
