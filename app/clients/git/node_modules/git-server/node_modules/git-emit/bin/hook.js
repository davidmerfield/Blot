#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var hookDir = path.dirname(process.argv[1]);

var dnode = require('dnode');
var port = parseInt(fs.readFileSync(hookDir + '/.git-emit.port', 'utf8'));
var readsStdin = [ 'pre-receive', 'post-receive', 'post-rewrite' ];

var hookName = path.basename(process.argv[1]);
dnode.connect(port, function (remote, conn) {
    function finish (ok) {
        conn.end();
        process.exit(ok ? 0 : 1);
    }
    
    if (readsStdin.indexOf(hookName) >= 0) {
        var data = '';
        process.stdin.on('data', function (buf) { data += buf });
        process.stdin.on('end', function () {
            remote.emit(hookName, {
                lines : data.split(/\r?\n/),
                arguments : process.argv.slice(2),
            }, finish);
        });
        
        process.stdin.resume();
    }
    else {
        remote.emit(hookName, {
            arguments : process.argv.slice(2),
        }, finish);
    }
});
