'use strict';

var inherits = require('util').inherits;
var Transform = require('stream').Transform;
var api = require('./api');

var DropboxDownloadStream = function DropboxDownloadStream(opts) {
  Transform.call(this, opts);
  this.getStream(opts.token, opts.filepath);
  this.offset = 0;
};
inherits(DropboxDownloadStream, Transform);

DropboxDownloadStream.prototype.getStream = function (token, filepath) {
  var _this = this;

  var req = api({
    call: 'download',
    token: token,
    args: {
      path: filepath
    }
  }, function (err, res) {
    if (err) {
      process.nextTick(function () {
        return _this.emit('error', err);
      });
      return;
    }

    _this.emit('metadata', res);
  });

  req.pipe(this);
};

DropboxDownloadStream.prototype._transform = function (chunk, encoding, cb) {
  this.offset += chunk.length;
  this.emit('progress', this.offset);
  cb(null, chunk);
};

module.exports = {
  DropboxDownloadStream,
  createDropboxDownloadStream: function createDropboxDownloadStream(opts) {
    return new DropboxDownloadStream(opts);
  }
};