module.exports = function makeUid (len) {
  return Math.random().toString(36).slice(3, (len || 6) + 3).toUpperCase()
}
