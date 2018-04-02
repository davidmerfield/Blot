var httpDuplex = require('../');
var http = require('http');
var fs = require('fs');

var server = http.createServer(function (req, res) {
    var dup = httpDuplex(req, res);
    console.log(dup.method + ' ' + dup.url);
    
    dup.setHeader('content-type', 'text/plain');
    
    if (dup.method === 'POST') {
        dup.pipe(process.stdout, { end : false });
        dup.on('end', function () {
            dup.end('ok\n');
        });
    }
    else fs.createReadStream(__filename).pipe(dup)
});

server.listen(8484);
