module.exports = function (subscription) {
  return !subscription || !subscription.status || subscription.status !== 'active';
}