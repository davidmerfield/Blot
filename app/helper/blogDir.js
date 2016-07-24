var fs = require('fs');
var rootDir = require('./rootDir');
var blogDir = rootDir + '/blogs';

// Ensure tmp dir exists
fs.exists(blogDir, function(exists) {

  if (!exists) {
    console.log('Made directory for blog files');
    fs.mkdir(blogDir, function(){

    });
  }

});

module.exports = blogDir;