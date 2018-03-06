#!/usr/bin/env node

/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const fs = require('fs');
const logger = require('loglevel').getLogger('dmn-server');
const postDecision = require('./dist/post-decision.js');
const deleteDecision = require('./dist/delete-decision.js');
const decisionDefinitionRestServer = require('./decision-definition-rest.js');
const decisionExecutionRpcServer = require('./decision-execution-rpc.js');
const parseDecision = require('./dist/parse-decision.js');
const { loadDecisions } = require('./dist/decision-fs-store.js');
const { getDecisionInLatestVersion } = require('./dist/decision-inmemory-store');

logger.setLevel('info');

if (process.argv.length < 5) {
  if (process.argv.length >= 2) {
    logger.error(`'Usage: ${process.argv[0]} ${process.argv[1]} <REST port> <RPC port> <file path>'`);
  } else {
    logger.error('Missing port and DMN file path parameters as command line arguments.');
  }
} else {
  const restPort = process.argv[2];
  const rpcPort = process.argv[3];
  const filePath = process.argv[4];
  if (!fs.existsSync(filePath)) {
    logger.error(`DMN file path ${filePath} does not exist.`);
  } else {
    loadDecisions(filePath, async (decision, xmlContent) => {
      logger.info(`Parsing decision ${decision}.`);
      const parsedDecisions = await parseDecision(xmlContent);
      getDecisionInLatestVersion(decision).parsedDecisions = parsedDecisions;
    });

    decisionDefinitionRestServer.post('/decisions/:decision', (req, res, next) => postDecision(req, res, next, filePath));
    decisionDefinitionRestServer.del('/decisions/:decision', (req, res, next) => deleteDecision(req, res, next, filePath));
    decisionDefinitionRestServer.listen(restPort, () => {
      logger.info('%s REST endpoint listening at %s', decisionDefinitionRestServer.name, decisionDefinitionRestServer.url);
    });

    decisionExecutionRpcServer.init({
      handler: rpcPort,
      timeout: 3,
      https: false, // boolean flag sets true if we want set up the HTTPS server
      key: null,  // the SSL-key path (for HTTPS only)
      cert: null,   // the SSL-cert path (for HTTPS only)
    });
    logger.info('%s JSON/RPC endpoint listening on port %s, DMN engine version: %s', decisionDefinitionRestServer.name, rpcPort, '1.3.0');
  }
}
