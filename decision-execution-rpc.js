/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const JsonRpcServer = require('jsonrpcserver');
const executeDecision = require('./dist/execute-decision.js');
const logger = require('loglevel').getLogger('dmn-server');

const decisionExecutionRpcServer = new JsonRpcServer(logger);

decisionExecutionRpcServer.register('/', {
  context: {
    executeDecision,
  },
  map: {
    executeDecision: {
      handler: 'executeDecision',
      params: {
        decisionName: {
          type: 'string',
          required: true,
        },
        context: {
          type: 'object',
          required: true,
        },
      },
    },
  },
});

module.exports = decisionExecutionRpcServer;

