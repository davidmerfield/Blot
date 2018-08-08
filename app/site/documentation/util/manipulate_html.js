var cheerio = require('cheerio');

module.exports = function manipulate_html (req, res, next) {

  var send = res.send;

  res.send = function (string) {

    var html = string instanceof Buffer ? string.toString() : string;
        
    var $ = cheerio.load(html, {decodeEntities: false});

    // $('pre').each(function(i, el){
      
    //   var lang = $(el).children('code').first().attr('class');

    //   if (lang) lang = lang.split('lang-').join('');

    //   $(el).addClass(lang);
    // });

    $('h2').each(function(i, el){

      var subsection_id, subsection_elements, subsection_html;

      subsection_id = $(el).attr('id') || $(el).text().split(' ').join('-').toLowerCase();
      subsection_elements = $(el).nextUntil('h2').add(el);

      $(el).removeAttr('id');

      subsection_html = '<div class="section" id="' + subsection_id + '">' + $.html(subsection_elements) + '</div>';

      $(subsection_elements)
        .before(subsection_html)
        .remove();
    });

    html = $.html();

    send.call(this, html);
  };

  next();
};