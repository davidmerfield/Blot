var test = require('tap').test;
var pushover = require('pushover');
var gitEmit = require('../');

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var seq = require('seq');

test('reject a patch', function (t) {
    t.plan(3);
    
    var repoDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
    var srcDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
    var dstDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
    
    fs.mkdirSync(repoDir, 0700);
    fs.mkdirSync(srcDir, 0700);
    fs.mkdirSync(dstDir, 0700);
    
    var port = Math.floor(Math.random() * ((1<<16) - 1e4)) + 1e4;
    var repos = pushover(repoDir, this.ok)
    repos.on('push', function (repo) {
        t.equal(repo, 'doom');
    });
    var server = repos.listen(port);
    
    process.chdir(srcDir);
    var repoEmitter;
    seq()
        .seq(function () { repos.create('doom', this) })
        .seq(function () {
            repoEmitter = gitEmit(repoDir + '/doom', this)
            repoEmitter.on('update', function (update) {
                t.ok(true);
                update.reject();
            });
        })
        .seq(function () {
            var ps = spawn('git', [ 'init' ]);
            ps.stderr.pipe(process.stderr, { end : false });
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
                'push', 'http://localhost:' + port + '/doom', 'master'
            ]);
            ps.stderr.pipe(process.stderr, { end : false });
            ps.on('exit', this.ok);
        })
        .seq_(function (next) {
            process.chdir(dstDir);
            spawn('git', [ 'clone', 'http://localhost:' + port + '/doom' ])
                .on('exit', this.ok)
        })
        .seq_(function (next) {
            path.exists(dstDir + '/doom/a.txt', function (ex) {
                t.ok(!ex, 'a.txt should not exist');
                next();
            })
        })
        .seq(function () {
            server.close();
            repoEmitter.close();
            t.end();
        })
        .catch(t.fail)
    ;
});
