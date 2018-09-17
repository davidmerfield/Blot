var cheerio = require('cheerio');
var fs = require('fs-extra');
var VIEW_DIR = require('./VIEW_DIR');

module.exports = function calculate_sidebar (req, res, next) {

  var send = res.send;

  res.send = function (string) {

    var html = string instanceof Buffer ? string.toString() : string;
    var $ = cheerio.load(html, {decodeEntities: false});

    $('h2, h3').each(function(i, el){

      var title = $(el).text();
      var title_slug = title.toLowerCase().split(' ').join('-');

      if (title_slug.indexOf('txe') > -1) title_slug = 'math';

      $(el).attr('id', title_slug);
    });




    // $('.section').each(function(i, el){

    //   var div = $('<div></div>');
    //   var a = $('<a href="#' + title_slug + '">' + title + '</a>');

    //   div.append(a);

    //   $(el).find('h3').each(function(i, el){

    //     var sub_title = $(el).text();
    //     var slug = sub_title.toLowerCase().split(' ').join('-');
    //     var a = $('<a class="sub_section" href="#' + slug + '">' + sub_title + '</a>');

    //     $(el).attr('id', slug);

    //     div.append(a);
    //   });

    //   $('.sub').append(div);

    // });

    html = $.html();

    send.call(this, html);
  };

  next(); 
};