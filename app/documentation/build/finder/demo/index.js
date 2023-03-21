var express = require('express');
var compression = require('compression');
var app = express();
var finder = require('../lib');


app.use(finder.middleware);
app.use(compression());

app.get('/', function (req, res) {
  res.send(require('fs-extra').readFileSync(__dirname + '/index.html', 'utf-8'));
});

app.get('/tools', function (req, res) {
  res.send(require('fs-extra').readFileSync(__dirname + '/tools/index.html', 'utf-8'));
});

app.get('/finder.css', function (req, res) {
  res.contentType('text/css');
  res.send(finder.css());
});

app.use(express.static(__dirname));



app.listen(9000);