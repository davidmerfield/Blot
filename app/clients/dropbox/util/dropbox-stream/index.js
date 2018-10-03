'use strict';

var upload = require('./upload');
var download = require('./download');

module.exports = {
  DropboxUploadStream: upload.DropboxUploadStream,
  createDropboxUploadStream: upload.createDropboxUploadStream,
  DropboxDownloadStream: download.DropboxDownloadStream,
  createDropboxDownloadStream: download.createDropboxDownloadStream
};