var fs = require("fs");
var config = require("config");
var joinpath = require("path").join;
var ensure = require("./ensure");
var AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: config.aws.key,
  secretAccessKey: config.aws.secret,
});

function upload(path, options, callback) {
  ensure(path, "string")
    .and(options, "object")
    .and(options.bucket, "string")
    .and(options.remote, "string")
    .and(callback, "function");

  var root = config.environment === "development" ? "" : "_dev/";
  var remote = joinpath(root, options.remote);
  var body = fs.createReadStream(path);

  var params = {
    Bucket: options.bucket,
    Key: remote,
  };

  var s3Client = new AWS.S3({ params: params });

  s3Client.upload({ Body: body }).send(function (err) {
    if (err) return callback(err);
    callback(null, options.bucket + "/" + path);
  });
}

module.exports = upload;