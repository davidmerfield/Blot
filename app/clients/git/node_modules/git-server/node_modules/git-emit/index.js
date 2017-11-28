var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var dnode = require('dnode');
var seq = require('seq');

var hook = require('./lib/hook');
var hookFile = __dirname + '/bin/hook.js';

module.exports = function (repoDir, cb) {
    var hookDir = path.resolve(repoDir) + '/hooks';
    var emitter = new EventEmitter;
    
    var port = Math.floor(Math.random() * ((1<<16) - 1e4) + 1e4);
    
    emitter.close = function () {
        server.close();
    };
    
    var server = emitter.server = dnode(function (remote, conn) {
        this.emit = function (hookName, args, finish) {
            var xs = emitter.listeners(hookName);
            if (xs.length === 0) finish(true)
            else if (!hook.canAbort[hookName]) {
                finish(true);
                emitter.emit(hookName, hook(hookName, args));
            }
            else {
                var pending = xs.length;
                var allOk = true;
                emitter.emit(hookName, hook(hookName, args, function (ok) {
                    allOk = allOk && ok;
                    if (--pending === 0) {
                        finish(allOk);
                    }
                }));
            }
        };
    }).listen(port);
    
    seq()
        .seq(function () {
            fs.writeFile(hookDir + '/.git-emit.port', port.toString(), this);
        })
        .set(hook.names)
        .parEach_(function (next, name) {
            var file = hookDir + '/' + name;
            fs.lstat(file, function (err, s) {
                if (err && err.code === 'ENOENT') {
                    fs.symlink(hookFile, file, next)
                }
                else if (err) next(err)
                else if (s.isSymbolicLink()) next()
                else next('hook file already exists: ' + file)
            });
        })
        .seq(function () {
            if (cb) cb(null, emitter)
        })
        .catch(cb || console.error)
    ;
    
    return emitter;
};
