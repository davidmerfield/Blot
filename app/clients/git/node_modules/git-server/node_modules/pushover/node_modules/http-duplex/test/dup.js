var test = require('tap').test;
var httpDuplex = require('../');
var http = require('http');
var request = require('request');
var fs = require('fs');
var selfSrc = fs.readFileSync(__filename);

var server = http.createServer(function (req, res) {
    var dup = httpDuplex(req, res);
    console.log(dup.method + ' ' + dup.url);
    
    dup.setHeader('content-type', 'text/plain');
    
    if (dup.method === 'POST') {
        var size = 0;
        dup.on('data', function (buf) { size += buf.length });
        dup.on('end', function () {
            dup.end(size + '\n');
        });
    }
    else fs.createReadStream(__filename).pipe(dup)
});

test(function (t) {
    t.plan(2);
    
    server.listen(0);
    server.on('listening', function () {
        var u = 'http://localhost:' + server.address().port + '/';
        
        request(u, function (err, res, body) {
            if (err) t.fail(err);
            t.equal(String(body), String(selfSrc));
        });
        
        var r = request.post(u, function (err, res, body) {
            if (err) t.fail(err);
            t.equal(body, '10\n');
        });
        r.end('beep boop\n');
    });
    
    t.on('end', function () {
        server.close();
    });
});
