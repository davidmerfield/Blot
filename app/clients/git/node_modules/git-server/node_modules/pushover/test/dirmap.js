var test = require('tap').test;
var pushover = require('../');

var fs = require('fs');
var path = require('path');
var exists = fs.exists || path.exists;

var spawn = require('child_process').spawn;
var http = require('http');

var seq = require('seq');

var repoDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
var srcDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
var dstDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
var targetDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);

fs.mkdirSync(repoDir, 0700);
fs.mkdirSync(srcDir, 0700);
fs.mkdirSync(dstDir, 0700);
fs.mkdirSync(targetDir, 0700);
    
var repos;
var server = http.createServer(function (req, res) {
    repos.handle(req, res);
});

test(function (t) {
    server.listen(0, function () {
        setTimeout(t.end.bind(t), 1000);
    });
});

test('clone into programatic directories', function (t) {
    t.plan(9);
    
    repos = pushover(function (dir) {
        t.equal(dir, 'doom.git');
        return path.join(targetDir, dir);
    });
    var port = server.address().port;
    
    process.chdir(srcDir);
    seq()
        .seq(function () {
            var ps = spawn('git', [ 'init' ]);
            ps.on('exit', this.ok);
        })
        .seq(function () {
            fs.writeFile(srcDir + '/a.txt', 'abcd', this);
        })
        .seq(function () {
            spawn('git', [ 'add', 'a.txt' ]).on('exit', this.ok)
        })
        .seq(function () {
            spawn('git', [ 'commit', '-am', 'a!!' ]).on('exit', this.ok)
        })
        .seq(function () {
            var ps = spawn('git', [
                'push', 'http://localhost:' + port + '/doom.git', 'master'
            ]);
            ps.on('exit', this.ok);
            ps.on('exit', function (code) {
                t.equal(code, 0);
            });
        })
        .seq(function () {
            process.chdir(dstDir);
            spawn('git', [ 'clone', 'http://localhost:' + port + '/doom.git' ])
                .on('exit', this.ok)
        })
        .seq_(function (next) {
            exists(dstDir + '/doom.git/a.txt', function (ex) {
                t.ok(ex, 'a.txt exists');
                next();
            })
        })
        .seq_(function (next) {
            exists(targetDir + '/HEAD', function (ex) {
                t.ok(ex, 'INFO exists');
                next();
            })
        })
        .catch(t.fail)
    ;
    
    repos.on('push', function (push) {
        t.equal(push.repo, 'doom.git');
        push.accept();
    });
    
    t.on('end', function () {
        server.close();
    });
});
