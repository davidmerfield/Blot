var insert_video_embeds = require('../../../helper').insert_video_embeds;

module.exports = function(entry, callback) {
  entry.html = fix_missing_p_tags(entry.html);
  entry.html = remove_caption(entry.html);
  entry.html = insert_video_embeds(entry.html);

  callback(null, entry);
};

function remove_caption(html) {
  while (html.indexOf("[caption") > -1) {
    var opening_index = html.indexOf("[caption");
    var remainder = html.slice(opening_index);
    var closing_index = remainder.indexOf("]");

    html =
      html.slice(0, opening_index) +
      html.slice(opening_index + closing_index + 1);
    html = html.split("[/caption]").join("");
  }

  return html;
}

function fix_missing_p_tags(html) {
  // Check for the closing tag instead of the
  // opening tag to avoid matching <p> and <p id="..."> etc...
  var has_p_tag = html.indexOf("</p>") > -1;
  var doesnt_have_double_line_break = html.indexOf("\n\n") === -1;

  if (has_p_tag || doesnt_have_double_line_break) return html;

  // console.log('! Warning, replacing missing <p> tags.')
  // console.log('---- BEFORE');
  // console.log(html);
  // console.log('----');

  html = html.split("\n\n");
  html = html.map(function(line) {
    return "<p>" + line + "</p>";
  });
  html = html.join("\n\n");

  // console.log('---- AFTER');
  // console.log(html);
  // console.log('----');

  return html;
}
