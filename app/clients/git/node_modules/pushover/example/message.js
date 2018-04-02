var pushover = require('../');
var repos = pushover('/tmp/repos');

repos.on('push', function (push) {
    console.log('push ' + push.repo + '/' + push.commit
        + ' (' + push.branch + ')'
    );
    push.accept();
});

repos.on('fetch', function (fetch) {
    console.log('fetch ' + fetch.repo + '/' + fetch.commit);
    fetch.accept();
});

repos.on('response', function (stream) {
    stream.end('EXTRA TEXT!\n');
});

var http = require('http');
var server = http.createServer(function (req, res) {
    repos.handle(req, res);
});
server.listen(7005);
