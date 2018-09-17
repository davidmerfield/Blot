var fs = require('fs-extra');
var uglify = require('uglify-js');
var static_dir = __dirname + '/../views';
var js_dir = static_dir + '/js';

module.exports = function (req, res, next) {

  var scripts = fs.readdirSync(js_dir);
  var js = '';

  scripts.forEach(function(name){
    
    if (name.indexOf('.js') == -1) return;
    js += '\n\n\n';
    js += fs.readFileSync(js_dir + '/' + name, 'utf-8');
  });
  
  js = uglify.minify(js, {fromString: true}).code;

  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'max-age=31536000');  
  res.send(js);
};