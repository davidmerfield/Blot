require('shelljs/global');

var fs = require('fs');
var Blog = require('../../app/models/blog');
var helper = require('../../app/helper');

var forEach = helper.forEach;
var copyFile = helper.copyFile;
var localPath = helper.localPath;

var thumbnail = require('../../app/thumbnail');
var input = fs.readFileSync(__dirname + '/input.html', 'utf-8');

var files = [
  '/source.jpg',
  '/source.png'
];

var blogID = '1';

console.log("Initializing test files...");

forEach(files, function(path, next){

  copyFile(__dirname + path, localPath(blogID, path), function(err){

    if (err) throw err;

    next();
  });

}, function(){

  Blog.get({id: blogID}, function(err, blog){

    console.log('Generating thumbnails for', input);
    console.time('Thumbnails finished in');

    thumbnail(blog, {}, input, function(err, thumbnails){

      console.timeEnd('Thumbnails finished in');

      if (err) console.log(err);

      console.log(thumbnails);

      var output = '<html><body>';

      for (var i in thumbnails) {
        output += '<p>' + i + '</p>';
        output += '<img src="http:' + thumbnails[i].url + '" width="' + thumbnails[i].width +'" height="'+ thumbnails[i].height + '"/><br />\n';
      }

      output += '</body></html>';

      fs.writeFileSync(__dirname + '/output.html', output, 'utf-8');

      exec('open ' + __dirname + '/output.html');

      setTimeout(function(){}, 1000*60*60);
    });
  });


});

