const config = require('./config.json');

const ROLES = [];

const sistema = config.sistema;

sistema.modulos.forEach(modulo => {
    if (modulo.status !== 'ativo') {
        return;
    }

    modulo.funcionalidade.forEach(funcionalidade => {
        if (funcionalidade.status !== 'ativo') {
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
