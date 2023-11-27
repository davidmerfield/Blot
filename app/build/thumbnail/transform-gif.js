const { execFile } = require("child_process");
const callOnce = require("helper/callOnce");
const extname = require("path").extname;
const async = require("async");
const gifsicle = require("gifsicle");
const sharp = require("sharp");
const thumbnails = require("./config").THUMBNAILS;

// Eventually remove this once Sharp supports animated gifs
// https://github.com/lovell/sharp/issues/1372
// https://github.com/lovell/sharp/pull/2012

function main(path, outputDirectory, callback) {
  let result = {};

  callback = callOnce(callback);

  async.eachOf(
    thumbnails,
    function (options, name, next) {
      // We want to ensure that this will work on case-sensitive
      // file systems so we lowercase it. In the past we used the
      // original filename for the file in the resulting path but
      // I couldn't work out how to handle filenames like ex?yz.jpg
      // Should I store the name URL-encoded (e.g. ex%3Fyz.jpg)...
      // Now I just use the guuid + size + file extension.
      const extension = extname(path).toLowerCase();
      const fileName = name.toLowerCase() + extension;
      const to = outputDirectory + "/" + fileName;

      transform(path, to, options, function (err, width, height) {
        if (err) return next(err);

        result[name] = {
          width: width,
          height: height,
          name: fileName,
        };

        next();
      });
    },
    function (err) {
      callback(err, result);
    }
  );
}

function transform(path, to, { size }, callback) {
  const args = [
    "--resize-fit-height",
    size,
    "--resize-fit-width",
    size,
    "-o",
    to,
    path,
  ];
  execFile(gifsicle, args, (err) => {
    if (err) return callback(err);
    sharp(to)
      .metadata()
      .then(function ({ width, height }) {
        callback(err, width, height);
      })
      .catch(function (err) {
        callback(err);
      });
  });
}

module.exports = main;
