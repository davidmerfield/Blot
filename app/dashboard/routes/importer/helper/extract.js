module.exports = function Extract ($, el) {

  return function (name, arr) {

    var result = [];

    var matches = $(el).contents().filter(function(){
      return this.name === name;
    });

    matches.each(function(){

      var html = $(this).html();

      if (html.indexOf('<![CDATA[') === 0) {
        html = html.slice('<![CDATA['.length, -3);
      }

      result.push(html);
    });

    result = result.filter(function(i){return !!i;});

    if (result.length === 1 && !arr) return result[0];

    if (result.length === 0) return '';

    return result;
  };
}