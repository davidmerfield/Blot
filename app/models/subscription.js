module.exports = (function () {

  var redis = require('./client'),
      helper = require('../helper'),
      logger = helper.logger,
      ensure = helper.ensure;

  function save (subscription, callback) {

    ensure(subscription, 'object')
      .and(callback, 'function');

    var customerID = subscription.customer;

    subscription = JSON.stringify(subscription);

    redis.set(customerPrefix(customerID), subscription, function(error, status){

      if (status) logger(null, 'Saved subscription for customer with', customerID);

      return callback(error, 'Customer saved');
    });
  }

  // Before the user is created this returns a string
  // of an object containing the stripe subscription info
  // After the user has authenticated with Dropbox
  function get (customerID, callback) {

    ensure(customerID, 'string')
      .and(callback, 'function');

    redis.get(customerPrefix(customerID), function(error, subscription){

      if (error || !subscription) {
        console.log(error || 'No customer with id ' + customerID);
      }

      return callback(subscription);
    });
  }

  // Connect a stripe customer ID to a blot UID
  // This allows us to retrieve the blot user
  // based on the customer ID when stripe calls
  // Blot webhooks for subscription events.
  function bind (customerID, uid, callback) {

    // This occurs if the user registered
    // through the free blot URL
    if (customerID === false) return callback();

    ensure(customerID, 'string')
      .and(uid, 'string')
      .and(callback, 'function');

    redis.set(customerPrefix(customerID), uid, function(error, status){

      if (error) throw error;

      if (status) logger(uid, 'Bound to customer with', customerPrefix(customerID));

      callback();
    });
  }


  function customerPrefix(id) {
    return 'customer:' + id;
  }

  return {
    save: save,
    get: get,
    bind: bind
  };

}());