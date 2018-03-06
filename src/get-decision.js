/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const errors = require('restify-errors');
const { getDecisionByVersion, getLatestVersionOfDecision, getAllDecisionsInLatestVersion } = require('./decision-inmemory-store');

function getDecision(req, res, next) {
  const decisionName = req.params.decision;
  const latestVersion = getLatestVersionOfDecision(decisionName);
  if (latestVersion === 0) {
    next(new errors.NotFoundError(`No decision named ${decisionName} was found.`));
  } else {
    res.contentType = 'json'; // eslint-disable-line no-param-reassign
    const result = {
      decisionName,
      latestVersionNumber: latestVersion,
    };
    const decision = getDecisionByVersion(decisionName, latestVersion);
    result.latestVersion = decision.xmlData;
    res.send(200, result);
    next();
  }
}

function getAllDecisions(req, res, next) {
  const allDecisionsInLatestVersion = getAllDecisionsInLatestVersion();
  if (allDecisionsInLatestVersion.decisionNames.length === 0) {
    res.send(204);
    next();
  } else {
    res.contentType = 'json'; // eslint-disable-line no-param-reassign
    const result = [];
    allDecisionsInLatestVersion.decisionNames.forEach((decisionName) => {
      result.push({
        decisionName,
        latestVersionNumber: getLatestVersionOfDecision(decisionName),
        latestVersion: allDecisionsInLatestVersion.decisions[decisionName].xmlData,
      });
    });
    res.send(200, result);
    next();
  }
}

function getDecisionSpecificVersion(req, res, next) {
  const decisionName = req.params.decision;
  const versionNumber = req.params.version;
  const latestVersion = getLatestVersionOfDecision(decisionName);
  if (latestVersion === 0 || latestVersion < versionNumber) {
    next(new errors.NotFoundError(`The decision named ${decisionName} does not exist in version ${versionNumber} or not at all.`));
  } else {
    res.contentType = 'json'; // eslint-disable-line no-param-reassign
    const result = {
      decisionName,
      latestVersionNumber: latestVersion,
      requestedVersionNumber: versionNumber,
    };
    const decision = getDecisionByVersion(decisionName, versionNumber);
    result.requestedVersion = decision.xmlData;
    res.send(200, result);
    next();
  }
}

function getDecisionAllVersions(req, res, next) {
  const decisionName = req.params.decision;
  const latestVersion = getLatestVersionOfDecision(decisionName);
  if (latestVersion === 0) {
    next(new errors.NotFoundError(`No decision named ${decisionName} was found.`));
  } else {
    res.contentType = 'json'; // eslint-disable-line no-param-reassign
    const result = {
      decisionName,
      latestVersionNumber: latestVersion,
      versions: {},
    };
    for (let i = 1; i <= latestVersion; i += 1) {
      const decision = getDecisionByVersion(decisionName, i);
      result.versions[i] = decision.xmlData;
    }
    res.send(200, result);
    next();
  }
}

module.exports = { getDecision, getAllDecisions, getDecisionSpecificVersion, getDecisionAllVersions };
