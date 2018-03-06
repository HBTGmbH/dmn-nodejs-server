/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const { getDecision, getAllDecisions, getDecisionSpecificVersion, getDecisionAllVersions } = require('./src/get-decision.js');
const restify = require('restify');

const server = restify.createServer({
  name: 'dmn-server v1.0.1',
  certificate: undefined,
  key: undefined,
});
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/decisions', getAllDecisions);
server.get('/decisions/:decision', getDecision);
server.get('/decisions/:decision/versions', getDecisionAllVersions);
server.get('/decisions/:decision/versions/:version', getDecisionSpecificVersion);

module.exports = server;

