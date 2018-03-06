/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const { decisionTable } = require('@hbtgmbh/dmn-eval-js');

async function parseDecision(xmlContent) {
  return decisionTable.parseDmnXml(xmlContent);
}


module.exports = parseDecision;
