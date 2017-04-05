module.exports = function(server){

  var url = require('url'),
      auth = require('authHandler'),
      User = require('user'),
      Entries = require('entries'),
      Entry = require('entry'),
      Blog = require('blog'),
      upload = require('../../../upload'),
      helper = require('helper'),
      tempDir = helper.tempDir(),
      formJSON = helper.formJSON,
      _ = require('lodash'),
      fs = require('fs'),
      extend = helper.extend,
      multiparty = require('multiparty');

      var DateStamp = require('../../../models/entry/build/prepare/dateStamp');

  /// Post files
  server.post('/update', auth.enforce, function(request, response){

    var user = request.user, uid = user.uid;
    var blog = request.blog, blogID = blog.id;

    var form = new multiparty.Form({
      uploadDir: tempDir,
      maxFieldsSize: 2 * 1024 * 1024,
      maxFilesSize: 2 * 1024 * 1024
    });

    form.parse(request, function(err, fields, files){

      var redirectURL = getRedirect(request);

      // This will almost certainly be an image too big
      if (err) {
        console.log(err);
        response.message({errors: {avatar: 'Image too large'}, url: redirectURL});
        return response.redirect(redirectURL);
      }

      // Map {name: ['David']} to {name: 'David'}
      // this is an idiosyncrasy of multiparty?
      for (var field in fields)
        fields[field] = fields[field].pop();

      var updates = formJSON(fields, {blog: Blog.scheme.TYPE, user: User.model});

      updates.blog = updates.blog || {};
      updates.user = updates.user || {};

      updates.blog.menu = updates.blog.menu || [];

      for (var i in updates.blog.menu) {

        for (var x in blog.menu) {

          if (blog.menu[x].id === updates.blog.menu[i].id) {

            extend(updates.blog.menu[i])
              .and(blog.menu[x]);

          }
        }
      }

      // Oterwhse the menu is deleted...
      if (!updates.blog.menu.length) {
        delete updates.blog.menu;
      }

      if (files.avatarUpload) {
        uploadAvatar(blogID, files.avatarUpload, then);
      } else {
        then(null, null);
      }

      function then (avatarError, avatarURL) {

        if (avatarURL) updates.blog.avatar = avatarURL;

        User.set(uid, updates.user, function(userErrors, userChanges){

          Blog.set(blogID, updates.blog, function(blogErrors, blogChanges){

            var changes = userChanges.concat(blogChanges);

            if (changes.indexOf('timeZone') > -1 ||
                changes.indexOf('dateDisplay') > -1) {

              Blog.get({id: blog.id}, function(err, blog){

                Entries.each(blogID, function(entry, nextEntry){

                  var dateStamp = DateStamp(blog, entry.path, entry.metadata);

                  // This is fine!
                  if (dateStamp === undefined) return nextEntry();

                  Entry.set(blogID, entry.path, {
                    dateStamp: dateStamp
                  }, nextEntry);

                }, function(){

                });
              });
            }

            var errors = {};

            extend(errors)
              .and(blogErrors || {})
              .and(userErrors || {});

            var redirectURL = getRedirect(request);

            // Avatar error is seperate from
            // the rest of the user update errors
            if (avatarError) errors.blog.avatar = avatarError;

            response.message({errors: errors, url: redirectURL});

            // Add success message if we're going to the settings page
            // and successful changes were made
            if (changes.length && _.isEmpty(errors)) {
              response.message({success: 'Made changes successfully!', url: redirectURL});
            }

            return response.redirect(redirectURL);
          });
        });
      }
    });
  });

  function uploadAvatar (blogID, file, callback) {

    if (!file || !file.length) return callback();

    file = file[0];

    if (!file.path) return callback();

    if (!file.size) return fs.unlink(file.path, function(){callback();});

    upload(file.path, {blogID: blogID, folder: 'avatars'}, callback);
  }

  function getRedirect(request) {

    var redirectURL, referrerURL;

    // Look up and see if there's a referrrer
    // to send the request back to
    if (request.headers && request.headers.referer)
      referrerURL = url.parse(request.headers.referer).pathname;

    // If the form defined a redirect URL then use that
    if (request.query && request.query.redirectURL)
      redirectURL = decodeURIComponent(request.query.redirectURL);

    // Prefer to send the user back to the URL specified
    // by the form, if none specified then send the user
    // back to where they submitted the form, if none
    // then send the user to the homepage
    return redirectURL || referrerURL || '/';
  }
};