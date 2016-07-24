module.exports = function prettyPrice (cents) {
  return '$' + (cents/100).toFixed(2)
}
