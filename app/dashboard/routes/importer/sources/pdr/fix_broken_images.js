module.exports = function($) {
  $("img").each(function(i, el) {
    var html = $.html(el);

    if (html.indexOf("=") === -1) return;

    var new_el = $("<img>");

    for (var x in el.attribs) if (x !== '"') new_el.attr(x, el.attribs[x]);

    $(el).replaceWith(new_el);
  });
};
