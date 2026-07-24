const jsonServer = require('json-server');
const path = require('path');

function createApp(root) {
	const server = jsonServer.create();
	const router = jsonServer.router(path.join(root, 'db.json'));
	const middlewares = jsonServer.defaults({ noCors: false });
	const rewriter = jsonServer.rewriter(require(path.join(root, 'routes.json')));

	server.use(middlewares);
	server.use(rewriter);

	server.get('/auth/realms/:realm/protocol/openid-connect/auth', (req, res) => {
		res.sendFile(path.join(root, 'login.html'));
	});

	server.get('/auth/realms/:realm/protocol/openid-connect/logout', (req, res) => {
		const redirect =
			req.query.post_logout_redirect_uri || req.query.redirect_uri;
		if (redirect) {
			return res.redirect(302, redirect);
		}
		return res.status(204).end();
	});

	server.use((req, res, next) => {
		if (req.method === 'POST' && req.url.includes('/token')) {
			req.method = 'GET';
		}
		next();
	});

	server.use((req, res, next) => {
		if (req.method === 'POST' && req.url.includes('/registrations')) {
			return res
				.status(201)
				.json({ message: 'User registered successfully (Mock)' });
		}
		next();
	});

	server.use(router);
	return server;
}

module.exports = createApp;
