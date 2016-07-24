var fs = require('fs');
var Entry = require('../../app/models/entry');
var Blog = require('../../app/models/blog');
var helper = require('../../app/helper');
var type = helper.type;
var _ = require('lodash');
var copyFile = helper.copyFile;
var localPath = helper.localPath;
var time = helper.time;

// var moment = require('moment');

var mustache = require('mustache');

var path = '/input.txt';
var image = '/image.jpg';

console.log("Initializing test file...");

Blog.get({id: '1'}, function(err, blog){

  if (!blog) throw 'No blog iwth id';

  blog.plugins.emoticons.enabled = true

  copyFile(__dirname + image, localPath(blog.id, image), function (err) {

    if (err) throw err;

    copyFile(__dirname + path, localPath(blog.id, path), function (err) {

      if (err) throw err;

      console.log("Starting build...");
      time("          TOTAL");

      Entry.build(blog, path, function(err, entry){

        if (err) console.log(err);

        time.end("          TOTAL");

        fs.writeFileSync(__dirname + '/output.json', JSON.stringify(entry, null, ' '), 'utf-8');
        fs.writeFileSync(__dirname + '/output.html', wrapper(entry.html), 'utf-8');

        console.log(line('HTML'));
        console.log(entry.html);

        console.log(line('KEYS'));
        console.log(tidy(entry));

        console.log(line('FILES'));
        console.log('HTML:', 'file://'+__dirname + '/output.html');
        console.log('JSON:', 'file://'+__dirname + '/output.json');

        // console.log(line('RENDERED HTML'));
        // console.log(render(entry.html));
      });
    });
  });
});

var l = '-------------------------------------------------';

function line (str) {

  if (!str) return l;

  var before = l.slice(0, l.length/2 - str.length/2 - 1);

  return [before, str, before].join(' ');
}

function wrapper(html){
  return '<html><head><meta charset="utf-8"></head><body>'+html+'</body></html>';
}

function tidy (obj) {

  obj = _.cloneDeep(obj);

  for (var i in obj)
    if (type(obj[i], 'string') && obj[i].length > 100)
      obj[i] = obj[i].slice(0,100) + '...';

  return obj;
}

function render (html) {

  var rendered;

  try {
    rendered = mustache.render(html, {});
  } catch (e) {
    rendered = 'FAIL';
  }

  return rendered;
}