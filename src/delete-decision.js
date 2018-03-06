/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const errors = require('restify-errors');
const { getLatestVersionOfDecision } = require('./decision-inmemory-store');
const { deleteDecisionFile } = require('./decision-fs-store');

function deleteDecision(req, res, next, fsRootPath) {
  const decisionName = req.params.decision;

  const onSuccess = () => {
    res.send(200);
    next();
  };
  const onError = (err) => {
    next(err);
  };

  if (getLatestVersionOfDecision(decisionName) === 0) {
    next(new errors.NotFoundError(`No decision named ${decisionName} was found.`));
  } else {
    deleteDecisionFile(fsRootPath, decisionName, onSuccess, onError);
  }
}

module.exports = deleteDecision;
