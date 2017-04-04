var express = require('express');
var server = express();
var fs = require('fs');
var THEMEDIR = __dirname + '/theme';
var helper = require('../../app/helper');
var forEach = helper.forEach;
var Hogan = require('hogan.js');
var FrontMatter = require('front-matter');

server.use(loadView);

function loadView (req, res, callback) {

  var template = frontMatter.body;
  var tree = Hogan.parse(Hogan.scan(template));

  console.log(metadata);
  console.log(tree);

  // build list of partials

  // retrieve partials

  // build list of locals used in all partials

  // retrieve locals

  callback();
}

function matches (route, url) {

  if (route === url) return true;

  var regex = new RegExp(route, 'g');

  if (regex.test(url)) return true;

  return false;
}

function tokens (route, url) {

  // route = /page/{{number}}
  // url   = /page/2

  // first, does the url match the format of the route?
  // second, does the  value of {{number}} return something?



}

function number (value, callback) {

}


function loadTemplate (url, callback) {

  var contents = fs.readdirSync(THEMEDIR);

  forEach(contents, function(filename, next){

    var file = fs.readFileSync(THEMEDIR + '/' + filename, 'utf-8');
    var frontMatter = FrontMatter(file);
    var metadata = frontMatter.attributes;

    console.log(metadata.route);

    if (matches(metadata.route, url)) throw 'HERE';

    if (hasToken(route))

    // We have a valid template

  }, function(){

  });
}

function loadView (req, res, next) {

  loadTemplate(req.url, function(err, template){

    loadView(req, res, function(){

      next();

      res.send('FOO');
    });
  });
}

server.listen(8989);
console.log('Listening at http://localhost:8989');