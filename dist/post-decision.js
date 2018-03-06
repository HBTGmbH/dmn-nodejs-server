/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const errors = require('restify-errors');
const parseDecision = require('./parse-decision');
const { getLatestVersionOfDecision } = require('./decision-inmemory-store');
const { writeDecisionFile } = require('./decision-fs-store');
const logger = require('loglevel').getLogger('dmn-server');

function postDecision(req, res, next, fsRootPath) {
  if (!req.is('application/xml')) {
    next(new errors.UnsupportedMediaTypeError('content-type: application/xml required'));
    return;
  }
  const xmlContent = req.body.toString();
  const decisionName = req.params.decision;

  // parse the received decision table
  // although the raw XML is stored, we should accept valid content only
  logger.info(`Parsing decision ${decisionName}.`);
  parseDecision(xmlContent).then((parsedDecisions) => {
    if (parsedDecisions[decisionName]) {
      const latestVersion = getLatestVersionOfDecision(decisionName);
      const onSuccess = () => {
        const protocol = (req.isSecure()) ? 'https' : 'http';
        const location = `${protocol}://${req.headers.host}/decisions/${decisionName}/versions/${latestVersion + 1}`;
        res.header('Location', location);
        res.send(201);
        next();
      };
      writeDecisionFile(fsRootPath, decisionName, xmlContent, parsedDecisions, onSuccess, (err) => {
        next(new errors.InternalServerError(err.toString()));
      });
    } else {
      next(new errors.ConflictError(`No decision named '${decisionName}' found in DMN XML content.`));
    }
  }).catch((err) => {
    logger.error(`Failed to parse decision ${decisionName}: ${err}`);
    next(new errors.BadRequestError(err.toString()));
  });
}

module.exports = postDecision;
