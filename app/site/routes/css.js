var fs = require('fs-extra');
var DataURI = require('datauri');
var CleanCSS = require('clean-css');
var minimize = new CleanCSS();
var static_dir = __dirname + '/../views';
var css_dir = static_dir + '/css';
var images_dir = static_dir + '/images';
var finder = require('finder');
var config = require('config');
module.exports = function (req, res, next) {

  var styles = fs.readdirSync(css_dir);
  var images = fs.readdirSync(images_dir);
  var css = '';

  css = finder.css();

  styles.forEach(function(name){
    
    if (name.indexOf('.css') == -1) return;

    css += '\n\n\n';
    css += fs.readFileSync(css_dir + '/' + name, 'utf-8');
  });
  
  images.forEach(function(name){
    
    if (css.indexOf(name) === -1) return;

    var datauri = new DataURI(images_dir + '/' + name);

    css = css.split('/images/' + name).join(datauri.content);
  });

  css = minimize.minify(css || '');

  res.set('Content-Type', 'text/css');
  if (config.cache) res.set('Cache-Control', 'max-age=31536000');  
  res.send(css);
};