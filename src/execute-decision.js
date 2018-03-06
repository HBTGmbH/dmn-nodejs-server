/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const { decisionTable } = require('@hbtgmbh/dmn-eval-js');
const { getDecisionInLatestVersion } = require('./decision-inmemory-store');
const loglevel = require('loglevel');

const logger = loglevel.getLogger('dmn-server');

function executeDecision(params, processResponse) {
  const context = params.context;
  const decisionName = params.decisionName;

  const decision = getDecisionInLatestVersion(decisionName);
  if (decision === undefined) {
    const errorMessage = `Decision ${decisionName} was not found.`;
    logger.info(errorMessage);
    processResponse({ decisionName, errorDetails: errorMessage });
  } else if (decision.parsedDecisions === undefined) {
    const errorMessage = `Decision ${decisionName} exists as DMN definition but has not been parsed so far.`;
    logger.info(errorMessage);
    processResponse({ decisionName, errorDetails: errorMessage });
  } else {
    logger.info(`Evaluating decision ${decisionName}.`);
    try {
      const evaluationResult = decisionTable.evaluateDecision(decisionName, decision.parsedDecisions, context);
      processResponse(undefined, evaluationResult);
    } catch (err) {
      const errorMessage = `Failed to evaluate decision: ${err}`;
      logger.info(errorMessage);
      processResponse({ decisionName, errorDetails: errorMessage });
    }
  }
}

module.exports = executeDecision;
