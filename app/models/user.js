module.exports = (function () {

  var Dropbox = require('dropbox');
  var config = require('../../config');
  var redis = require('./client'),
      cache = require('../cache'),
      helper = require('../helper'),
      augment = helper.extend,
      forEach = helper.forEach,
      validate = require('./validate'),
      logger = helper.logger,
      ensure = helper.ensure,
      _ = require('lodash'),

      // The user spec
      userModel = {
        uid: 'string',
        email: 'string',
        isDisabled: 'boolean',
        name: 'string',
        blogs: 'array',
        lastSession: 'string',
        folderState: 'string',
        countryCode: 'string',
        credentials: 'object',
        subscription: 'object'
      },

      DEFAULT = {
        email: '',
        isDisabled: false,
        name: '',
        blogs: [],
        lastSession: '',
        folderState: '',
        countryCode: 'US',
        subscription: {},
        credentials: {}
      };

  function create (client, email, subscription, callback) {

    ensure(client, 'object')
      .and(email, 'string')
      .and(subscription, 'object')
      .and(callback, 'function');

    var uid = client.dropboxUid();

    var user = {
      uid: uid,
      blogs: [],
      email: email,
      credentials: client.credentials(),
      subscription: subscription
    };

    // Check the user isn't already stored
    get(uid, function(existingUser){

      // If so then just update their info
      if (existingUser) {
        return set(uid, {email: email, subscription: subscription}, function(){
          update(client, callback);
        });
      }

      // Set the new user
      set(uid, user, function (error) {

        if (error) throw error;

        // All the neccessary stuff complete
        // so call back now
        callback();

        client.getAccountInfo(function(error, info){

          var updates = {
            name: info.name,
            countryCode: info.countryCode
          };

          set(uid, updates, function(){});
        });
      });
    });
  }

  function update (client, callback) {

    ensure(client, 'object')
      .and(callback, 'function');

    var uid = client.dropboxUid();

    // When the user logs in they might generate
    // a new set of dropbox credentials, or they
    // might not. I'm not sure so to be sure I
    // save their credentials each time they log in
    set(uid, {credentials: client.credentials()}, function () {

      logger(uid, 'Updated user');
      callback();
    });
  }

  // Maps uid, dictionary of updates to dictionary
  // of errors and an array of changed key names.
  // Calling set with these paramaters:
  // ('1234', {name: 'david', email: 'INVALID_EMAIL'})
  // Will set the new name in the DB then invoke a
  // callback with these parameters:
  // ({email: 'Please enter a valid email'}, ['name'])
  function set (uid, updates, callback, options) {

    options = options || {};

    ensure(uid, 'string')
      .and(updates, userModel)
      .and(callback, 'function')
      .and(options, 'object');

    validate(uid, updates, function(errors, validUpdates){

      get(uid, function(oldInfo){

        oldInfo = oldInfo || {};

        var changes = {},
            newInfo = _.clone(oldInfo, true);

        // Determine any changes to the user's info
        for (var i in validUpdates)
          if (!_.isEqual(oldInfo[i], validUpdates[i]))
            changes[i] = newInfo[i] = validUpdates[i];

        // Append default values if possible
        augment(newInfo).and(DEFAULT);

        // Verify that all the new info matches
        // strictly the type specification
        ensure(newInfo, userModel, true);

        redis.set(userKey(uid), JSON.stringify(newInfo), function(err){

          if (err) throw err;

          var changesArray = _.keys(changes);

          // Invalidate the cache for all the user's blogs
          forEach.parallel(newInfo.blogs, function(blogID, nextBlog){

            cache.clear(blogID, nextBlog);

          }, function(){

            if (changesArray.length && !options.silent)
              logger(uid, 'Set', changes);

            if (_.isEmpty(errors))
              errors = null;

            callback(errors, changesArray);
          });
        });
      });
    });
  }

  function get (uid, callback) {

    ensure(uid, 'string')
      .and(callback, 'function');

    redis.get(userKey(uid), function(error, user){

      if (error) throw error;

      if (!user) return callback();

      return callback(JSON.parse(user));
    });
  }

  function getBy (by, callback) {

      ensure(by, 'object')
        .and(callback, 'function');

      if (by.uid) {
        ensure(by.uid, 'string');
        then(null, by.uid);
      }

      function then (err, uid) {

        if (err) return callback (err);

        if (!uid) return callback(null);

        if (by.onlyUID) return callback(null, uid);

        get(uid, function (user) {

          if (!user) return callback(null);

          // Sanitize the user before exposing
          if (by.credentials === undefined || by.credentials === false)
            delete user.credentials;

          if (by.noCrap === undefined)
            user = extend(user);

          callback(null, user);
        });
      }
    }

  function extend (user) {

    user.pretty = {};

    var subscription = user.subscription;

    if (subscription) {

      if (subscription.plan) {
        user.pretty.amount = subscription.quantity;
        user.pretty.expiry = helper.prettyDate(user.subscription.current_period_end * 1000);
        user.pretty.price = helper.prettyPrice(user.subscription.plan.amount * subscription.quantity);
      }

      if (subscription.cancel_at_period_end)
        user.cancel_at_period_end = true;

      if (!subscription.cancel_at_period_end &&
          subscription.status === 'active' ||
          subscription.status === 'trialing')
        user.isSubscribed = true;

      if (!subscription.customer)
        user.isFreeForLife = true;

      if (subscription.status === 'unpaid')
        user.isUnpaid = true;

      if (subscription.status === 'past_due')
        user.isPastDue = true;

      if (subscription.status === 'canceled')
        user.isDisabled = true;

      if (user.isUnpaid || user.isPastDue)
        user.needsToPay = true;
    }

    if (user.blogs.length !== 1) {
      user.multipleBlogs = true;
      user.s = 's'; // used like this: you run blog{{s}} on blot...
      user.are = 'are';
    } else {
      user.multipleBlogs = false;
      user.s = '';
      user.are = 'is';
    }

    return user;
  }

  function makeClient (uid, callback) {

    var client = new Dropbox.Client(config.dropbox);

    getCredentials(uid, function(err, credentials){

      if (err) return callback(err);

      client.setCredentials(credentials);

      client.authenticate(callback);
    });
  }

  function userKey (uid) {
    return 'user:' + uid + ':info';
  }

  function getCredentials (uid, callback) {

    ensure(uid, 'string')
      .and(callback, 'function');

    get(uid, function(user){

      if (user && user.credentials)
        return callback(null, user.credentials);

      return callback(new Error('No user with uid ' + uid));
    });
  }

  function getAllUIDs (callback) {

    ensure(callback, 'function');

    redis.keys(userKey('*'), function(err, keys){

      var uids = [];

      for (var i in keys)
        uids.push(keys[i].replace('user:', '').replace(':info', ''));

      return callback(uids);
    });
  }

  return {
    set: set,
    getBy: getBy,
    getCredentials: getCredentials,
    getAllUIDs: getAllUIDs,
    create: create,
    makeClient: makeClient,
    update: update,
    model: userModel
  };

}());