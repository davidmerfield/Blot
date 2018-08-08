var debug = require('debug')('clients:dropbox:authenticate');
var get_account = require('./get_account');
var set_account = require('./set_account');
var prepare_folder = require('./prepare_folder');
var authenticate = require('express').Router();
var write_existing_contents = require('./write_existing_contents');
var lock_on_folder = require('./lock_on_folder');
var redirect = require('./redirect');

// This route sends the user to Dropbox
// to consent to Blot's connection.
authenticate.route('/redirect')
  .get(redirect);

// This route recieves the user back from
// Dropbox when they have accepted or denied
// the request to access their folder.
authenticate.route('/').get(
  lock_on_folder.acquire,
  get_account,
  prepare_folder,
  write_existing_contents,
  set_account,
  lock_on_folder.release  
);

authenticate.use(function(req, res){
    
  // Release sync lease
  if (req.on_complete) {
    debug('Calling sync on_complete in non-error handler!');
    req.on_complete();
  } 

  res.message('/', 'Authentication to Dropbox successful!');
});

authenticate.use('/existing-account', function(err, req, res, next){

  // Release sync lease
  if (req.on_complete) {
    req.on_complete();
    debug('Calling sync on_complete in existing-error handler!');
  }

  // Token used to connect to Dropbox is no longer valid
  if (err && err.status && err.status === 401) {
    res.message({error: 'That <a href="/">access token</a> is no longer valid. Please use another one', url: '/clients/dropbox'});
    debug(req.baseUrl, req.url, req.path);
    return res.redirect('/clients/dropbox');
  }

  next(err);
});

authenticate.use(function(err, req, res, next){

  if (req.on_complete) {
    debug('Calling sync on_complete in error handler!');
    req.on_complete();
  } 

  if (err && err.message) {
    res.message({error: err.message, url: '/clients/dropbox'});
    debug(req.baseUrl, req.url, req.path);
    return res.redirect('/clients/dropbox');
  }

  debug('error here');
  next(err);
});


module.exports = authenticate;