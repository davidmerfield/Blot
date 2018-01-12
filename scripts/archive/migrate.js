var Blog = require('../app/models/blog');
var eachBlog = require('./each/blog');
var Dropbox = require('../app/clients/dropbox/node_modules/dropbox');
var database = require('../app/clients/dropbox/database');
var redis = require('../app/node_modules/client');

eachBlog(function(user, blog, next){

  update_account(blog, function(err, account){

    if (err) {
      console.log('x', blog.id, blog.handle, err.status || err.message || 'no message');
    } else if (account) {
      console.log('✔', blog.id, blog.handle, account.account_id, account.folder, account.folder_id);
    }

    if (account) {
      blog.client = 'dropbox';
    } else if (blog.credentials) {
      blog.client = '';
    }

    if (blog.client === undefined)
      blog.client = '';

    var should_remove = [
      'folder',
      'folderState',
      'credentials',
      'pageSize'
    ];

    var multi = redis.multi();

    should_remove.forEach(function(key){

      if (!blog[key]) return;

      multi.hdel('blog:' + blog.id + ':info', key);
      delete blog[key];
      console.log('Deleting', key);
    });

    multi.exec(function(err){

      if (err) return callback(err);

      Blog.set(blog.id, blog, function(err){

        if (err) return callback(err);

        next();
      });
    });
  });
}, process.exit);

function retrieve_account (credentials, callback) {

  if (!credentials)
    return callback(new Error('No credentials'));

  try {
    credentials = JSON.parse(credentials);
  } catch (e) {
    console.log(e);
    return callback(e);
  }

  if (!credentials.token)
    return callback(new Error('No credentials'));

  var access_token = credentials.token;
  var client = new Dropbox({accessToken: access_token});

  client.usersGetCurrentAccount()
    .then(function(res) {

      var account_id = res.account_id;
      var email = res.email;

      if (!email || !account_id)
        return callback(new Error('No email or account ID'));

      callback(null, account_id, access_token, email);
    })
    .catch(callback);
}

function retrieve_folder (access_token, folder, callback) {

  if (!folder || folder.trim().toLowerCase() === '/')
    return callback(null, '', '');

  var client = new Dropbox({accessToken: access_token});

  client.filesGetMetadata({path: folder})
    .then(function(res){
      callback(null, res.path_display, res.id);
    })
    .catch(callback);

}

function update_account (blog, callback) {

  retrieve_account(blog.credentials, function(err, account_id, access_token, email){

    if (err) return callback(err);

    retrieve_folder(access_token, blog.folder, function(err, folder, folder_id){

      if (err) return callback(err);

       var account = {
          account_id: account_id,
          email: email,
          access_token: access_token,
          error_code: 0,
          last_sync: Date.now(),
          full_access: false,
          folder: folder,
          folder_id: folder_id,
          cursor: ''
        };

      database.set(blog.id, account, function(err){

        if (err) return callback(err);

        callback(null, account);
      });
    });
  });
}