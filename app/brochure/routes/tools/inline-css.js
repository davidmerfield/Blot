var juice = require('juice');
var cheerio = require('cheerio');
var fs = require('fs');
var CSS = require('css');
var CleanCSS = require("clean-css");
var minimize = new CleanCSS();

module.exports = function render_tex (req, res, next) {

  var send = res.send;

  res.send = function (string) {

    var html = string instanceof Buffer ? string.toString() : string;

    var $ = cheerio.load(html, {decodeEntities: false});

    $('link[rel="stylesheet"]').each(function(){

      var css;
      var href = $(this).attr('href');

      if (href.indexOf('?') > -1) href = href.slice(0, href.indexOf('?'));
      
      var pathToCSSFile = __dirname + '/../../views' + href;
        
      try{
        
        css = fs.readFileSync(pathToCSSFile, 'utf-8');

      } catch (e) {
        console.log(e);
        console.log('failed to load', pathToCSSFile);
        return;
      }

      $(this).replaceWith('<style type="text/css">' + css + '</style>');
    });

    html = $.html();

    // Inline properties from <style> tags
    html = juice(html, {inlinePseudoElements: true});

    var $ = cheerio.load(html, {decodeEntities: false});
    var css = '';

    $('style[type="text/css"]').each(function(){

      // If the style tag is inside a <noscript> tag
      // then it is important that it doesn't move...
      if ($(this).parents('noscript').length) return;

      css += $(this).contents();
      
      $(this).remove();
    });

    css = minimize.minify(css || "").styles;

    var obj = CSS.parse(css);
      
    for (var i in obj.stylesheet.rules) {

      var rule = obj.stylesheet.rules[i];
      
      if (rule.type !== 'rule') continue;
      
      var shouldMakeImportant;
      
      console.log(rule.selectors);

      for (var x in rule.selectors)
        if (rule.selectors[x].indexOf(':hover') > -1 ||
          rule.selectors[x].indexOf(':active') > -1 || 
          rule.selectors[x].indexOf(':focus') > -1)
          shouldMakeImportant = true;

      if (!shouldMakeImportant) continue;

      for (var y in rule.declarations) {
        if (rule.declarations[y].value.indexOf('!important') > -1) continue;
        rule.declarations[y].value+='!important'
      }
        
    }

    css = CSS.stringify(obj);

    $('head').append('<style type="text/css">' + css + '</style>');

    // console.log(css);

    html = $.html();

    send.call(this, html);
  };

  next();  
};