function splitRight(self, sep, maxSplit, limit) {

  if (typeof maxSplit === 'undefined') {
    var maxSplit = -1;
  }
  if (typeof limit === 'undefined') {
    var limit = 0;
  }

  var splitResult = [self];

  for (var i = self.length-1; i >= 0; i--) {

    if (
      splitResult[0].slice(i).indexOf(sep) === 0 &&
      (splitResult.length <= maxSplit || maxSplit === -1)
    ) {
      splitResult.splice(1, 0, splitResult[0].slice(i+sep.length)); // insert
      splitResult[0] = splitResult[0].slice(0, i)
    }
  }

  if (limit >= 0) {
    return splitResult.slice(-limit);
  } else {
    return splitResult.slice(0, -limit);
  }

}

module.exports = splitRight;
