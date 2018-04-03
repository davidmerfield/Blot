/**
 * LCOV Result merger
 *
 * Author:
 *   Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   2013 Michael Weibel
 *
 * License:
 *   MIT
 */

var through2 = require('through2')
  , File = require('vinyl');

/*
 * Object to represent DA record
 */
function DA(lineNumber, hits) {
  this.lineNumber = lineNumber;
  this.hits = hits;
}

/*
 * Object to represent BRDA record
 */
function BRDA(lineNumber, blockNumber, branchNumber, hits) {
  this.lineNumber = lineNumber;
  this.blockNumber = blockNumber;
  this.branchNumber = branchNumber;
  this.hits = hits; // Always a string. See below.
}

/*
 * Object to represent coverage file and it's DA/BRDA records
 */
function coverageFile(filename) {
  this.filename = filename;
  this.DARecords = [];
  this.BRDARecords = [];
}

/*
 * Will find an existing DA record
 */
function findDA(source, lineNumber) {
  for (var i=0; i < source.length; i++) {
    if (source[i].lineNumber === lineNumber) {
      return source[i];
    }
  }
  return null;
}

/*
 * Will find an existing BRDA record
 */
function findBRDA(source, blockNumber, branchNumber, lineNumber) {
  for (var i=0; i < source.length; i++) {
    if (source[i].blockNumber === blockNumber &&
      source[i].branchNumber === branchNumber &&
      source[i].lineNumber === lineNumber) {
      return source[i];
    }
  }
  return null;
}

/*
 * will find an existing coverage file
 */
function findCoverageFile(source, filename) {
  for (var i=0; i < source.length; i++) {
    if (source[i].filename === filename) {
      return source[i];
    }
  }
  return null;
}

/*
 * Process a lcov input file into the representing Objects
 */
function processFile(data, lcov) {
  var lines = data.split('\n'),
    currentFileName = '',
    currentCoverageFile = null;

  function _numericHits(hits) {
    if (hits === '-'){
      return 0;
    }
    return parseInt(hits, 10);
  }

  function _mergedBRDAHits(existingBRDAHits, newBRDAHits) {

    // If we've never executed the branch code path in an existing coverage
    // record and we've never executed it here either, then keep it as '-'
    // (eg, never executed). If either of them is a number, then
    // use the number value.
    if(existingBRDA.hits !== '-' || hits !== '-') {
      return _numericHits(existingBRDAHits) + _numericHits(newBRDAHits);
    }

    return '-';
  }

  for(var i = 0, l = lines.length; i < l; i++) {
    var line = lines[i];
    if(line === 'end_of_record' || line === '') {
      currentFileName = '';
      currentCoverageFile = null;
      continue;
    }

    var prefixSplit = line.split(':'),
      prefix = prefixSplit[0];

    if(prefix === 'SF') {
      // If the filepath contains a ':', we want to preserve it.
      prefixSplit.shift();
      currentFileName = prefixSplit.join(':');
      currentCoverageFile = findCoverageFile(lcov, currentFileName);
      if(currentCoverageFile) {
        continue;
      }
      currentCoverageFile = new coverageFile(currentFileName);
      lcov.push(currentCoverageFile);
      continue;
    }

    var numberSplit, lineNumber, hits;

    if(prefix === 'DA') {
      numberSplit = prefixSplit[1].split(',');
      lineNumber = parseInt(numberSplit[0], 10);
      hits = parseInt(numberSplit[1], 10);
      var existingDA = findDA(currentCoverageFile.DARecords, lineNumber);
      if(existingDA) {
        existingDA.hits += hits;
        continue;
      }
      var newDA = new DA(lineNumber, hits);
      currentCoverageFile.DARecords.push(newDA);
      continue;
    }

    if(prefix === 'BRDA') {
      numberSplit = prefixSplit[1].split(',');
      lineNumber = parseInt(numberSplit[0], 10);
      var blockNumber = parseInt(numberSplit[1], 10),
        branchNumber = parseInt(numberSplit[2], 10);
      var existingBRDA = findBRDA(currentCoverageFile.BRDARecords,
                  blockNumber, branchNumber, lineNumber);
      // Special case, hits might be a '-'. This means that the code block
      // where the branch was contained was never executed at all (as opposed
      // to the code being executed, but the branch not being taken). Keep
      // it as a string and let _mergedBRDAHits work it out.
      hits = numberSplit[3];

      if (existingBRDA) {
        existingBRDA.hits = _mergedBRDAHits(existingBRDA.hits, hits);
        continue;
      }
      var newBRDA = new BRDA(lineNumber, blockNumber, branchNumber, hits);
      currentCoverageFile.BRDARecords.push(newBRDA);
      continue;
    }
    // We could throw an error here, or, we could simply ignore it, since
    // we're not interested.
    // throw new Error('Unknown Prefix "' + prefix + '"');
  }
  return lcov;
}

/*
 * Creates LCOV records for given list of files.
 */
function createRecords(coverageFiles) {
  return coverageFiles.map(function(coverageFile) {
    var header = 'SF:' + coverageFile.filename + '\n';
    var footer = 'end_of_record\n';
    var body = coverageFile.DARecords.map(function(daRecord) {
      return 'DA:' + daRecord.lineNumber + ',' +
        daRecord.hits + '\n';
    }).join('') + coverageFile.BRDARecords.map(function(brdaRecord) {
      return 'BRDA:' + brdaRecord.lineNumber + ',' +
        brdaRecord.blockNumber + ',' + brdaRecord.branchNumber + ',' +
        brdaRecord.hits + '\n';
    }).join('');
    return header + body + footer;
  }).join('');
}

module.exports = function() {
  var coverageFiles = [];
  return through2.obj(function process(file, encoding, callback) {
    if (file.isNull()) {
      callback();
      return;
    }
    if (file.isStream()) {
      throw new Error('Streaming not supported');
    }
    coverageFiles = processFile(file.contents.toString(), coverageFiles);
    callback();
  }, function flush() {
    var file = new File({
      path: 'lcov.info',
      contents: new Buffer(createRecords(coverageFiles))
    });
    this.push(file);
    this.emit('end');
  });
};
