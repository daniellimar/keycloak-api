const createApp = require('./app');

const PORT = process.env.PORT || 9090;
const app = createApp(__dirname);

app.listen(PORT, () => {
	console.log(`Mock Keycloak running at http://localhost:${PORT}`);
});
