/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const decisionStore = new Map();
const logger = require('loglevel').getLogger('dmn-server');

function addDecision(name, version, xmlData, parsedDecisions) {
  if (!decisionStore.has(name)) {
    decisionStore.set(name, []);
  }
  const decisions = decisionStore.get(name);
  decisions[version - 1] = { xmlData, parsedDecisions };
  logger.info(`Added version ${decisions.length} for decision ${name}.`);
  return decisions.length;
}

function removeLatestVersionOfDecision(name) {
  if (!decisionStore.has(name)) {
    throw new Error(`Cannot remove latest version of decision ${name}, decision was not found.`);
  }
  const decisions = decisionStore.get(name);
  decisions.pop();
  if (decisions.length === 0) {
    decisionStore.delete(name);
    logger.info(`Removed the only version of decision ${name}, removed decision altogether.`);
  } else {
    const newLatestVersion = decisions.length;
    logger.info(`Removed latest versiosn of decision ${name}, now version ${newLatestVersion} is the latest version.`);
  }
}

function getAllDecisionsInLatestVersion() {
  const result = { decisionNames: [], decisions: {} };
  for (const entry of decisionStore) { // eslint-disable-line no-restricted-syntax
    const decisionName = entry[0];
    const decisionVersions = entry[1];
    const decisionInLatestVersion = decisionVersions[decisionVersions.length - 1];
    result.decisionNames.push(decisionName);
    result.decisions[decisionName] = decisionInLatestVersion;
  }
  return result;
}

function getDecisionByVersion(name, version) {
  if (!decisionStore.has(name)) {
    throw new Error(`No such decision '${name}'`);
  }
  const decisions = decisionStore.get(name);
  if (version === undefined) {
    throw new Error(`Queried decision ${name} with undefined version`);
  }
  if (decisions.length < version) {
    throw new Error(`No such version ${version} for decision '${name}'`);
  }
  return decisions[version - 1];
}

function getLatestVersionOfDecision(name) {
  if (!decisionStore.has(name)) {
    return 0;
  }
  const decisions = decisionStore.get(name);
  return decisions.length;
}

function getDecisionInLatestVersion(name) {
  const latestVersion = getLatestVersionOfDecision(name);
  if (latestVersion > 0) {
    return getDecisionByVersion(name, latestVersion);
  }
  throw new Error(`No such decision ${name}.`);
}

module.exports = {
  addDecision,
  getAllDecisionsInLatestVersion,
  getDecisionByVersion,
  getLatestVersionOfDecision,
  getDecisionInLatestVersion,
  removeLatestVersionOfDecision,
};
