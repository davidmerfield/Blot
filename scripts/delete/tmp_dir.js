var tmpDir = require('../../app/helper').tempDir();
var exec =  require('child_process').exec;

var DELETE_OLD = "find " + tmpDir + " -mindepth 1 -ctime +1 -delete";
var DELETE_EMPTY = "find " + tmpDir + " -type d -empty -delete"

exec(DELETE_OLD);
exec(DELETE_EMPTY);