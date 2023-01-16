function count(self, substr) {
  var count = 0
  var pos = self.indexOf(substr)

  while (pos >= 0) {
    count += 1
    pos = self.indexOf(substr, pos + 1)
  }

  return count
}

module.exports = count