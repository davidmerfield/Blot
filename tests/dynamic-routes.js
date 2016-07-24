var client = require('redis').createClient();
var helper = require('../app/helper');
var forEach = helper.forEach;

var key = {
  routes: 'test:routes'
};

// USE THIS?
// https://github.com/pillarjs/path-to-regexp

init(function(){

  lookup('/page/2/t/3', function(err, route, param){

    if (err) throw err;

    if (route) console.log('MATCHED ROUTE', route, param);

    console.log('DONE!');
  });
});

function init (cb) {

  var routes = [
    '/',
    '/page/{{page}}/t/{{cunt}}'
  ];

  for (var i = 0; i < routes.length;i++) {
    routes[i] = strip(routes[i]);
  }

  client.sadd(key.routes, routes, function(err, stat){

    if (err) throw err;

    cb();

  });

  // map

  // /page/{{page}} to /page//*

  //page/ -> store the string for a regex which can extract 2 from /page/2

  // {page: 2}

}

function strip (str) {
  return str.replace(/\{{.+?}}/g, '(.[^\/]*)')
}

function lookup (url, callback) {

  client.smembers(key.routes, function(err, routes){

    if (err) throw err;

    if (routes.indexOf(url) > -1)
      return callback(null, routes[routes.indexOf(url)]);

    for (var i = 0; i < routes.length;i++) {

      if (routes[i].indexOf('(.*)') === -1)
        continue;

      if (is(url, routes[i])) {

        var m = new RegExp(routes[i], 'i');

        console.log(url.match(m));

        var param = url.match(m)[1];

        return callback(null, routes[i], param);
      }
    }

    return callback(null);
  });
}

// console.time('is');
// console.log(is('/page/2', '/'));
// console.timeEnd('is');

// console.time('is');
// console.log(is('/page', '/page/(.*)'));
// console.timeEnd('is');

// console.time('is');
// console.log(is('/page/10', '/page/(.*)'));
// console.timeEnd('is');

// console.time('is');
// console.log(is('/page/10/11', '/page/(.*)'));
// console.timeEnd('is');

function is (input, from) {
  from = new RegExp(from, 'g');
  return from.test(input);
}


//page/2
