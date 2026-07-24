const serverless = require('serverless-http');
const createApp = require('../../app');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const app = createApp(ROOT);

module.exports.handler = serverless(app);
