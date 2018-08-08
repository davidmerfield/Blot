var cheerio = require('cheerio');
var katex = require('katex');
var md = require('markdown-it')()
          .use(require('markdown-it-footnote'));

var INPUT = '[data-input]';
var OUTPUT = '[data-output]';

module.exports = function render_tex (req, res, next) {

  var send = res.send;

  res.send = function (string) {

    var html = string instanceof Buffer ? string.toString() : string;

    var $ = cheerio.load(html, {decodeEntities: false});

    $(INPUT).each(function(i, el){      

      var markdown = $(el).html();
      var result = md.render(markdown);
      var output;

      $(el).parents().each(function(i, parent_el){
        
        output = $(parent_el).find(OUTPUT);

        if (!output.length) return true;

        output.html(result);
        return false;
      });


    });

    html = $.html();

    send.call(this, html);
  };

  next();  
};