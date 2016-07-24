var app = require('express')();
var hogan = require('hogan-express');
var eachBlog = require('../../scripts/each/blog');
var getBlog = require('../../scripts/blog/get');
var Entry = require('../../app/models/entry');
var Entries = require('../../app/models/entries');
var ota = require('../../app/oneTimeAuth');

var helper = require('../../app/helper');
var forEach = helper.forEach.multi(50);

app
  .set('view engine', 'html')
  .set('views', __dirname)
  .engine('html', hogan);

app.get('/', function (req, res) {

  var blogs = [];

  eachBlog(function(user, blog, next){

    if (blog.isDisabled) return next();

    ota.generate(blog.owner, function(err, token){

      if (err) throw err;

      blog.auth = 'http://localhost:8080/OTP/' + token;
      blogs.push(blog);
      next();
    });

  }, function(){

    res.render('index', {
      blogs: blogs,
      partials: {header: 'header', footer: 'footer'}
    });

  });
});


function rebuild (blog, callback) {

  var blogID = blog.id;

  Entry.getAllIDs(blogID, function(err, entryIDs){

    forEach(entryIDs, function(entryID, nextEntry){

      Entry.get(blogID, entryID, function(entry){

        if (!entry) return nextEntry();

        // Otherwise this would
        // make the entry visible...
        if (entry.deleted) return nextEntry();

        Entry.build(blog, entry.path, function(err, entry){

          if (err && err.code === 'ENOENT') {
            console.log('No local file for entry with id', entryID);
            return nextEntry();
          }

          // don't know
          if (err) {
            console.log('-----> REBUILD ERROR ON APPS PAGE');
            console.log(err);
            if (err.stack) console.log(err.stack);
            if (err.trace) console.log(err.trace);
            return nextEntry();
          }

          Entry.save(blogID, entry, nextEntry);
        });
      });
    }, callback);
  });
}

app.get('/rebuild/:handle', function(req, res){

  getBlog(req.params.handle, function(user, blog){

    rebuild(blog, function(){

      res.redirect('/view/' + req.params.handle);

    });
  });
});

app.get('/view/:handle', function (req, res) {

  getBlog(req.params.handle, function(user, blog){

    Entries.get(blog.id, {lists: ['entries', 'pages']}, function(err, lists){

      var entries = lists.entries.concat(lists.pages);

      if (!entries || !entries.length) return res.send('No entries :(');

      var firstEntry;

      while (!firstEntry) {
        if (!entries.length) break;
        firstEntry = entries.pop();
      }

      if (!firstEntry) return res.send('No entries :(');

      var url = firstEntry.url;

      return res.redirect(req.url + url);
    });
  });
});

app.get('/view/:handle*', function (req, res) {

  getBlog(req.params.handle, function(user, blog){

    var url = req.params[0];

    Entries.get(blog.id, {lists: ['entries', 'pages']}, function(err, lists){

      var entries = lists.entries.concat(lists.pages);

      Entry.getByUrl(blog.id, url, function(entry){

        if (!entry) return res.status(404).send('404');

        entries = entries.map(function(_entry){

          _entry.selected = _entry.id === entry.id;
          _entry.selected = _entry.selected ? 'selected' : '';

          return _entry;
        });

        entries.reverse();

        var after = 'http://' + blog.handle + '.localhost:8080/' + url;
        var before = 'http://' + blog.handle + '.blot.im/' + url;

        res.render('view', {
          blog: blog,
          entry: entry,
          entries: entries,
          before: before,
          after: after,
          partials: {
            header: 'header',
            footer: 'footer',
            frame: 'frame'
          }
        });
      });
    });
  });
});

app.listen(8888);
console.log('Listening on 8888');