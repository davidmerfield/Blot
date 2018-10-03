'use strict';

var fs = require('fs-extra');
var test = require('ava');
var got = require('got');
var api = require('./api');
var db = require('./index');

var TOKEN = '';

test.before(function () {
  if (!TOKEN) {
    throw new Error('No dropbox API access token found');
  }
});

test.after.always(function () {
  return got('https://api.dropboxapi.com/2/files/delete_v2', {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: '{"path":"/test"}'
  });
});

test.serial.cb('fails to download non-existent file', function (t) {
  db.createDropboxDownloadStream({
    token: TOKEN,
    filepath: '/test/non.existent'
  }).on('metadata', function () {
    return t.fail();
  }).on('error', function (err) {
    t.is(err.name, 'HTTPError');
    t.is(err.statusCode, 409);
    t.end();
  }).pipe(fs.createWriteStream('./test.txt'));
});

test.serial.cb('uploads a file to dropbox with simple upload api', function (t) {
  api({
    token: TOKEN,
    call: 'upload',
    data: 'TEST',
    args: {
      path: '/test/test.txt',
      autorename: true
    }
  }, function (err, res) {
    if (err) {
      return t.fail(err);
    }

    t.truthy(res.id);
    t.is(res.path_lower, '/test/test.txt');
    t.is(res.name, 'test.txt');
    t.end();
  });
});

test.serial.cb('downloads the file', function (t) {
  t.plan(4);
  db.createDropboxDownloadStream({
    token: TOKEN,
    filepath: '/test/test.txt'
  }).on('metadata', function (metadata) {
    t.truthy(metadata.id);
    t.is(metadata.path_lower, '/test/test.txt');
    t.is(metadata.name, 'test.txt');
  }).on('error', function (err) {
    return t.fail(err);
  }).pipe(fs.createWriteStream('./test.txt')).on('finish', function () {
    t.pass();
    t.end();
  });
});

test.serial.cb('uploads a file with none ASCII name', function (t) {
  api({
    token: TOKEN,
    call: 'upload',
    data: 'TEST',
    args: {
      path: '/test/测试.txt',
      autorename: true
    }
  }, function (err, res) {
    if (err) {
      return t.fail(err);
    }
    t.truthy(res.id);
    t.is(res.path_lower, '/test/测试.txt');
    t.is(res.name, '测试.txt');
    t.end();
  });
});

test.serial.cb('uploads a small file with a stream', function (t) {
  t.plan(4);

  var up = db.createDropboxUploadStream({
    token: TOKEN,
    filepath: '/test/small.txt',
    chunkSize: 100 * 1024
  }).on('error', function (err) {
    return t.fail(err);
  }).on('progress', function (res) {
    return t.truthy(res);
  }).on('metadata', function (metadata) {
    t.truthy(metadata.id);
    t.is(metadata.path_lower, '/test/small.txt');
    t.is(metadata.name, 'small.txt');
    t.end();
  });

  fs.createReadStream('./readme.md').pipe(up);
});

test.serial.cb('uploads a big file with session api', function (t) {
  t.plan(7);

  var up = db.createDropboxUploadStream({
    token: TOKEN,
    filepath: '/test/big.txt',
    chunkSize: 10 * 1024
  }).on('error', function (err) {
    return t.fail(err);
  }).on('progress', function (res) {
    return t.truthy(res);
  }).on('metadata', function (metadata) {
    t.truthy(metadata.id);
    t.is(metadata.path_lower, '/test/big.txt');
    t.is(metadata.name, 'big.txt');
    t.end();
  });

  fs.createReadStream('./package-lock.json').pipe(up);
});

test.serial.cb('downloads a big file', function (t) {
  t.plan(16);
  db.createDropboxDownloadStream({
    token: TOKEN,
    filepath: '/test/big.txt'
  }).on('metadata', function (metadata) {
    t.truthy(metadata.id);
    t.is(metadata.path_lower, '/test/big.txt');
    t.is(metadata.name, 'big.txt');
  }).on('progress', function (res) {
    return t.truthy(res);
  }).on('error', function (err) {
    return t.fail(err);
  }).pipe(fs.createWriteStream('./test.txt')).on('finish', function () {
    t.pass();
    t.end();
  });
});

test.serial.cb('deletes temporary file', function (t) {
  fs.unlink('./test.txt', function (err) {
    if (err) {
      t.fail();
    }

    t.end();
  });
});