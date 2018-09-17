var Transformer = require('../index');
var fs = require('fs');
var localPath = require('../../localPath');
var cp = require('../../copyFile');

// This function looks to see if there is any information
// about the file stored. If not, then it invokes middleware
// function with a path to a temp version of the file.
// Once the middleware is complete, it calls the done and the
// info is now stored...

var blogID = '1000';

// testURL('https://pbs.twimg.com/media/Cj-ffhPUkAET01m.jpg', done);

testPath('/input.txt', done);

function done (err, result){

  if (err) throw err;

  console.log(result);
}

function testURL (url, callback) {

  var sizer = new Transformer(blogID, 'sizer');

  sizer.lookup(url, function (path, done){

    console.log('Transforming', path);

    fs.stat(path, function(err, stat){

      if (err) done(err);

      done(null, {size: stat.size});
    });
  }, callback);
}

function testPath (path, callback) {

  var lowercase = new Transformer(blogID, 'lowercase');

  var src = __dirname + path;
  var dest = localPath(blogID, path);

  // lowercase.flush(function(){

  //   console.log("Flushed lowercase...");

    cp(src, dest, function(err){

      if (err) throw err;

      lowercase.lookup(path, function (path, done){

        console.log('Transforming', path);

        fs.readFile(path, 'utf-8', function(err, contents){

          if (err) done(err);

          done(null, {
            contents: contents.toLowerCase(),
            size: contents.length
          });
        });
      }, callback);
    });
  // });
}


