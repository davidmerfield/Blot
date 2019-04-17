var juice = require('juice');
var cheerio = require('cheerio');
var fs = require('fs');

module.exports = function render_tex (req, res, next) {

  var send = res.send;

  res.send = function (string) {

    var html = string instanceof Buffer ? string.toString() : string;

    var $ = cheerio.load(html, {decodeEntities: false});

    $('link[rel="stylesheet"]').each(function(){

      var css;
      var pathToCSSFile = __dirname + '/../../views' + $(this).attr('href');
        
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
    html = juice(html);

    send.call(this, html);
  };

  next();  
};