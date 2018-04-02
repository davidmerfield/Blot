var test = require('tap').test;
var pushover = require('../');

var fs = require('fs');
var path = require('path');
var exists = fs.exists || path.exists;

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var http = require('http');

var seq = require('seq');

test('create, push to, and clone a repo', function (t) {
    t.plan(17);
    
    var repoDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
    var srcDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
    var dstDir = '/tmp/' + Math.floor(Math.random() * (1<<30)).toString(16);
    var lastCommit;
    
    fs.mkdirSync(repoDir, 0700);
    fs.mkdirSync(srcDir, 0700);
    fs.mkdirSync(dstDir, 0700);
    
    var repos = pushover(repoDir, { autoCreate : false });
    var port = Math.floor(Math.random() * ((1<<16) - 1e4)) + 1e4;
    var server = http.createServer(function (req, res) {
        repos.handle(req, res);
    });
    server.listen(port);
    
    process.chdir(srcDir);
    seq()
        .seq(function () { repos.create('doom', this) })
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
        .seq_(function (next) {
            var ps = spawn('git', [ 'commit', '-am', 'a!!' ]);
            ps.on('exit', this.ok);
            ps.stdout.pipe(process.stdout, { end : false });
        })
        .seq(function () {
            var ps = spawn('git', ['tag', '0.0.1']);
            ps.stderr.pipe(process.stderr, { end : false });
            ps.on('exit', this.ok);
        })
        .seq(function () {
            fs.writeFile(srcDir + '/a.txt', 'efgh', this);
        })
        .seq(function () {
            spawn('git', [ 'add', 'a.txt' ]).on('exit', this.ok)
        })
        .seq_(function (next) {
            var ps = spawn('git', [ 'commit', '-am', 'a!!' ]);
            ps.on('exit', function () {
                exec('git log | head -n1', function (err, stdout) {
                    lastCommit = stdout.split(/\s+/)[1];
                    next();
                });
            });
            ps.stdout.pipe(process.stdout, { end : false });
        })
        .seq(function () {
            var ps = spawn('git', ['tag', '0.0.2']);
            ps.stderr.pipe(process.stderr, { end : false });
            ps.on('exit', this.ok);
        })
        .seq(function () {
            var ps = spawn('git', [
                'push', '--tags', 'http://localhost:' + port + '/doom', 'master'
            ]);
            ps.stderr.pipe(process.stderr, { end : false });
            ps.on('exit', this.ok);
        })
        .seq(function () {
            process.chdir(dstDir);
            spawn('git', [ 'clone', 'http://localhost:' + port + '/doom' ])
                .on('exit', this.ok)
        })
        .seq_(function (next) {
            exists(dstDir + '/doom/a.txt', function (ex) {
                t.ok(ex, 'a.txt exists');
                next();
            })
        })
        .seq(function () {
            server.close();
            t.end();
        })
        .catch(t.fail)
    ;
    
    repos.on('push', function (push) {
        t.equal(push.repo, 'doom', 'repo name');
        t.equal(push.commit, lastCommit, 'commit ok');
        t.equal(push.branch, 'master', 'master branch');
        
        t.equal(push.headers.host, 'localhost:' + port, 'http host');
        t.equal(push.method, 'POST', 'is a post');
        t.equal(push.url, '/doom/git-receive-pack', 'receive pack');
        
        push.accept();
    });

    var firstTag = true;
    repos.on('tag', function (tag) {
        t.equal(tag.repo, 'doom', 'repo name');
        t.equal(tag.version, '0.0.' + (firstTag? 1 : 2), 'tag received');

        t.equal(tag.headers.host, 'localhost:' + port, 'http host');
        t.equal(tag.method, 'POST', 'is a post');
        t.equal(tag.url, '/doom/git-receive-pack', 'receive pack');

        tag.accept();
        firstTag = false;
    });
});
