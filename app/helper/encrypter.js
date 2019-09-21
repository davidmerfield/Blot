var ensure = require("./ensure"),
  config = require("../../config"),
  crypto = require("crypto"),
  fs = require("fs"),
  zlib = require("zlib"),
  algorithm = "aes-256-ctr",
  password = config.backup.password;

function encrypt(input, output, callback) {
  ensure(input, "string")
    .and(output, "string")
    .and(callback, "function");

  if (input === output) return callback("Input must be different to output");

  fs.exists(input, function(inputExists) {
    if (!inputExists)
      return callback(new Error("Input does not exist: " + input));

    fs.exists(output, function(outputExists) {
      if (outputExists)
        return callback(new Error("Output has a file already: " + output));

      // input file
      var r = fs.createReadStream(input);
      // zip content
      var zip = zlib.createGzip();
      // encrypt content
      var encrypt = crypto.createCipher(algorithm, password);
      // write file
      var w = fs.createWriteStream(output);

      // Callback on compelte
      w.on("finish", callback);

      // start pipe
      r.pipe(zip)
        .pipe(encrypt)
        .pipe(w);
    });
  });
}

function decrypt(input, output, callback) {
  ensure(input, "string")
    .and(output, "string")
    .and(callback, "function");

  if (input === output) return callback("Input must be different to output");

  fs.exists(input, function(inputExists) {
    if (!inputExists)
      return callback(new Error("Input does not exist: " + input));

    fs.exists(output, function(outputExists) {
      if (outputExists)
        return callback(new Error("Output has a file already: " + output));

      // input file
      var r = fs.createReadStream(input);
      // unzip content
      var unzip = zlib.createGunzip();
      // decrypt file
      var decrypt = crypto.createDecipher(algorithm, password);
      // write file
      var w = fs.createWriteStream(output);

      // Callback on compelte
      w.on("finish", callback);

      r.pipe(decrypt)
        .pipe(unzip)
        .pipe(w);
    });
  });
}

module.exports = { encrypt: encrypt, decrypt: decrypt };
