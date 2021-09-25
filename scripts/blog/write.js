var async = require("async");
var yesno = require("yesno");
var fs = require("fs-extra");
var path = require("path");
var get = require("../get/blog");

get(process.argv[2], function (err, user, blog) {
  main(blog, process.argv[3], process.argv[4], function (err) {
    if (err) throw err;
    console.log("Writes complete!");
    process.exit();
  });
});

function main(blog, from, to, callback) {
  var clients = require("clients");
  var client = clients[blog.client];

  from = path.resolve(process.cwd(), from);
  to = path.resolve("/", to);

  determineWrites(blog, from, to, function (err, writes) {
    if (err) return callback(err);

    console.log(`Make ${Object.keys(writes).length} writes?`);

    for (to in writes) {
      console.log("");
      console.log("FROM:", writes[to], fs.statSync(writes[to]).size + " bytes");
      console.log("  TO:", to);
    }

    yesno.ask("Proceed (y/N)?", false, function (ok) {
      if (!ok) return callback(new Error("Not ok"));

      async.eachOfSeries(
        writes,
        function (from, to, next) {
          fs.readFile(from, function (err, contents) {
            if (err) return next(err);
            client.write(blog.id, to, contents, next);
          });
        },
        callback
      );
    });
  });
}

function determineWrites(blog, from, to, callback) {
  fs.stat(from, function (err, stat) {
    if (stat.isDirectory()) {
      walk(from, function (err, files) {
        let writes = {};

        files.forEach((file) => {
          writes[path.join(to, file.slice(from.length))] = file;
        });

        callback(null, writes);
      });
    } else {
      callback(null, { to: from });
    }
  });
}

function walk(dir, done) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function (file) {
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}
