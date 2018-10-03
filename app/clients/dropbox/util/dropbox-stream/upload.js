'use strict';

var inherits = require('util').inherits;
var Transform = require('stream').Transform;
var api = require('./api');

var DropboxUploadStream = function DropboxUploadStream() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  Transform.call(this, opts);
  this.chunkSize = opts.chunkSize || 1000 * 1024;
  this.filepath = opts.filepath;
  this.token = opts.token;
  this.autorename = opts.autorename || true;
  this.session = undefined;
  this.offset = 0;
};
inherits(DropboxUploadStream, Transform);

DropboxUploadStream.prototype.checkBuffer = function (chunk) {
  if (!this.buffer) {
    this.buffer = new Buffer(chunk);
  } else {
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  return this.buffer.length >= this.chunkSize;
};

DropboxUploadStream.prototype.progress = function () {
  this.offset += this.buffer ? this.buffer.length : 0;
  this.emit('progress', this.offset);
  this.buffer = undefined;
};

DropboxUploadStream.prototype._transform = function (chunk, encoding, cb) {
  if (!this.checkBuffer(chunk)) {
    return cb();
  }

  if (!this.session) {
    this.uploadStart(cb);
  } else {
    this.uploadAppend(cb);
  }
};

DropboxUploadStream.prototype._flush = function (cb) {
  if (this.session) {
    this.uploadFinish(cb);
  } else {
    this.upload(cb);
  }
};

DropboxUploadStream.prototype.upload = function (cb) {
  var _this = this;

  api({
    call: 'upload',
    token: this.token,
    data: this.buffer,
    args: {
      path: this.filepath,
      autorename: this.autorename
    }
  }, function (err, res) {
    if (err) {
      _this.buffer = undefined;
      return cb(err);
    }

    _this.progress();
    _this.emit('metadata', res);
    process.nextTick(function () {
      return cb();
    });
  });
};

DropboxUploadStream.prototype.uploadStart = function (cb) {
  var _this2 = this;

  api({
    call: 'uploadStart',
    token: this.token,
    data: this.buffer
  }, function (err, res) {
    if (err) {
      _this2.buffer = undefined;
      return cb(err);
    }

    _this2.session = res.session_id;
    _this2.progress();
    cb();
  });
};

DropboxUploadStream.prototype.uploadAppend = function (cb) {
  var _this3 = this;

  api({
    call: 'uploadAppend',
    token: this.token,
    data: this.buffer,
    args: {
      cursor: {
        session_id: this.session,
        offset: this.offset
      }
    }
  }, function (err) {
    if (err) {
      _this3.buffer = undefined;
      return cb(err);
    }

    _this3.progress();
    cb();
  });
};

DropboxUploadStream.prototype.uploadFinish = function (cb) {
  var _this4 = this;

  api({
    call: 'uploadFinish',
    token: this.token,
    data: this.buffer,
    args: {
      cursor: {
        session_id: this.session,
        offset: this.offset
      },
      commit: {
        path: this.filepath,
        autorename: this.autorename
      }
    }
  }, function (err, res) {
    if (err) {
      _this4.buffer = undefined;
      return cb(err);
    }

    _this4.progress();
    _this4.emit('metadata', res);
    process.nextTick(function () {
      return cb();
    });
  });
};

module.exports = {
  DropboxUploadStream,
  createDropboxUploadStream: function createDropboxUploadStream(opts) {
    return new DropboxUploadStream(opts);
  }
};