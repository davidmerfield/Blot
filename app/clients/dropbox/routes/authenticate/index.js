var config = require('config');
var Dropbox = require('dropbox');
var database = require('database');
var get_account = require('./get_account');
var set_account = require('./set_account');
var switch_account = require('./switch_account');
var prepare_folder = require('./prepare_folder');
var callback_uri = require('./callback_uri');

var authenticate = require('express').Router();

// This route sends the user to Dropbox
// to consent to Blot's connection.
authenticate.get('/redirect', function (req, res) {

  var callback, key, secret, authentication_url;

  if (req.query.full) {
    console.log('redirecting to full');
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
    callback = callback_uri(req) + '?full=true';
  } else {
    console.log('redirecting to app');
    key = config.dropbox.app.key;
    secret = config.dropbox.app.secret;
    callback = callback_uri(req);
  }

  var client = new Dropbox({
    "clientId": key,
    "secret": secret
  });

  authentication_url = client.getAuthenticationUrl(callback, null, 'code');
  authentication_url = authentication_url.replace('response_type=token', 'response_type=code');

  res.redirect(authentication_url);
});


// This route recieves the user back from
// Dropbox when they have accepted or denied
// the request to access their folder.
authenticate.get('/', get_account, function (req, res, next){

  var existing_account = req.account;
  var new_account = req.new_account;
  var log = console.log.bind(this, 'Dropbox:', new_account.email, '(' + new_account.id + ')');

  var same_account = !!existing_account && existing_account.id === new_account.id;
  var same_permissions = !!existing_account && existing_account.full === new_account.full;

  var full_folder = new_account.full === true;
  var app_folder = full_folder === false;

  var changed_account = !!existing_account && existing_account.id !== new_account.id;
  var reauthenticated = same_account && same_permissions;

  // Copy across existing folder info, save and sync
  if (reauthenticated) {
    new_account.folder_id = existing_account.folder_id;
    log('re-authenticated');
    return set_account(req, res, next);
  }

  // Offer user the choice to transfer existing files
  // from the local folder, to the new dropbox folder.
  if (changed_account) {
    req.session.new_account = new_account;
    log('is about to switch from', existing_account.email, '(' + existing_account.id + ')');
    return res.redirect(req.baseUrl + '/switch-account');
  }

  // My general strategy is to create a folder
  // on behalf of the user somewhere in their
  // Dropbox. This location depends on the permissions
  // they have granted us. I will also offer a one
  // click 'undo feature' which will remove the folder
  // where possible and revoke Blot's access in the case
  // of an accidental click or something like that.
  database.get_blogs_by_account_id(new_account.id, function(err, blogs){

    // This is the first blog connected to this Dropbox account
    if (app_folder && blogs.length === 0)  {
      log('connected with app folder access and no existing blogs in the folder.');
      return set_account(req, res, next);
    }

    if (app_folder && blogs.length === 1 && other_blog_is_root) {
      return create_sub_folders(req, res, next);
    }

    if (app_folder && blogs.length > 1) {
      return create_app_folders(req, res, next);
    }

    console.log('here. is app?', app_folder, 'existing blogs?', blogs.length);

    // We will need to ask the user to select a new folder for this blog
    req.session.new_account = new_account;
    return res.redirect('/clients/dropbox/select-folder');
  });
});

module.exports = authenticate;