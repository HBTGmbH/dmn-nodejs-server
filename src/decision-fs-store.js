/*
*  ©2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/

const { addDecision, getLatestVersionOfDecision, removeLatestVersionOfDecision } = require('./decision-inmemory-store');
const fs = require('fs');
const separator = require('path').sep;
const logger = require('loglevel').getLogger('dmn-server');

function loadDecisionFile(rootPath, decision, version, decisionFile, callback) {
  const decisionPath = rootPath + separator + decision + separator + version + separator + decisionFile;
  logger.info(`Reading version ${version} of decision ${decision} from file ${decisionPath}`);
  fs.readFile(decisionPath, { encoding: 'UTF-8' }, (err, xmlData) => {
    if (err) {
      logger.error(`Failed to read DMN file for version ${version} of decision '${decision}' from path ${decisionPath}: ${err}`);
    } else {
      addDecision(decision, version, xmlData);
      if (callback) {
        callback(decision, xmlData);
      }
    }
  });
}

function loadDecisionVersion(rootPath, decision, version, callback) {
  const decisionVersionPath = rootPath + separator + decision + separator + version;
  logger.info(`Found version ${version} of decision ${decision} in path ${decisionVersionPath}`);
  fs.readdir(decisionVersionPath, { encoding: 'UTF-8' }, (err, decisionFiles) => {
    if (err) {
      logger.error(`Failed to read DMN files for version ${version} of decision '${decision}' from path ${decisionVersionPath}: ${err}`);
    } else {
      decisionFiles.forEach((decisionFile) => {
        loadDecisionFile(rootPath, decision, version, decisionFile, callback);
      });
    }
  });
}

function loadDecision(rootPath, decision, callback) {
  const decisionPath = rootPath + separator + decision;
  logger.debug(`Found decision '${decision}' in path ${decisionPath}`);
  fs.readdir(decisionPath, { encoding: 'UTF-8' }, (err, decisionVersionDirs) => {
    if (err) {
      logger.error(`Failed to get versions for decision '${decision}' from path ${decisionPath}: ${err}`);
    } else {
      decisionVersionDirs.forEach((decisionVersionDir) => {
        loadDecisionVersion(rootPath, decision, decisionVersionDir, callback);
      });
    }
  });
}

function loadDecisions(rootPath, callback) {
  logger.info(`Loading decision from root path ${rootPath}.`);
  fs.readdir(rootPath, { encoding: 'UTF-8' }, (err, decisionDirs) => {
    if (err) {
      logger.error(`Failed to read from filesystem path ${rootPath}: ${err}`);
    } else {
      decisionDirs.forEach((decisionDir) => {
        loadDecision(rootPath, decisionDir, callback);
      });
    }
  });
}

function writeDecisionFile(rootPath, name, xmlData, parsedDecisions, onSuccess, onError) {
  const newVersion = getLatestVersionOfDecision(name) + 1;
  const decisionDirectory = `${rootPath}${separator}${name}`;
  const versionDirectory = `${decisionDirectory}${separator}${newVersion}`;
  const filename = `${versionDirectory}${separator}${name}.dmn`;

  const writeFile = () => {
    fs.writeFile(filename, xmlData, (err) => {
      if (err) {
        logger.error(`Failed to write DMN file ${filename} for version ${newVersion} of decision ${name}: ${err}`);
        if (onError) {
          onError(err);
        }
      } else {
        logger.info(`Saved DMN file ${filename} for version ${newVersion} of decision ${name}.`);
        addDecision(name, newVersion, xmlData, parsedDecisions);
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  };

  const createVersionDirectory = () => {
    fs.mkdir(versionDirectory, (err) => {
      if (err) {
        logger.error(`Failed to create directory for version ${newVersion} of decision ${name}: ${err}`);
        if (onError) {
          onError(err);
        }
      } else {
        writeFile();
      }
    });
  };

  if (newVersion === 1) {
    // create the directory for the decision first
    fs.mkdir(decisionDirectory, (err) => {
      if (err) {
        logger.error(`Failed to create directory for decision ${name}: ${err}`);
        if (onError) {
          onError(err);
        }
      } else {
        createVersionDirectory();
      }
    });
  } else {
    createVersionDirectory();
  }
}

function deleteDecisionFile(rootPath, name, onSuccess, onError) {
  const decisionDirectory = `${rootPath}${separator}${name}`;
  const latestVersion = getLatestVersionOfDecision(name);
  if (latestVersion === 0) {
    logger.error(`Decision ${name} was not found.`);
    return;
  }
  const versionDirectory = `${decisionDirectory}${separator}${latestVersion}`;
  const filename = `${versionDirectory}${separator}${name}.dmn`;
  fs.unlink(filename, (err) => {
    if (err) {
      logger.error(`Failed to delete decision file ${filename}: ${err}`);
      if (onError) {
        onError(err);
      }
    } else {
      removeLatestVersionOfDecision(name);
      fs.rmdir(versionDirectory, (err) => {
        if (err) {
          logger.error(`Failed to delete directory for version ${latestVersion} of decision ${name}.`);
          if (onError) {
            onError(err);
          }
        } else {
          logger.info(`Deleted directory for version ${latestVersion} of decision ${name}.`);
          if (onSuccess) {
            onSuccess();
          }
          if (latestVersion === 1) {
            fs.rmdir(decisionDirectory, (err) => {
              if (err) {
                logger.error(`Failed to delete base directory of decision ${name}.`);
              } else {
                logger.info(`Deleted base directory of decision ${name}.`);
              }
            });
          }
        }
      });
    }
  });
}

module.exports = { loadDecisions, writeDecisionFile, deleteDecisionFile };
