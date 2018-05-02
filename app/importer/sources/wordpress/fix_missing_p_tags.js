module.exports = function (html) {

  // Check for the closing tag instead of the 
  // opening tag to avoid matching <p> and <p id="..."> etc...
  var has_p_tag = html.indexOf('</p>') > -1;
  var doesnt_have_double_line_break = html.indexOf('\n\n') === -1;

  if (has_p_tag || doesnt_have_double_line_break) return html;

  console.log('! Warning, replacing missing <p> tags.')
  // console.log('---- BEFORE');
  // console.log(html);
  // console.log('----');

  html = html.split('\n\n');
  html = html.map(function(line){return '<p>'+line+'</p>';});
  html = html.join('\n\n');

  // console.log('---- AFTER');
  // console.log(html);
  // console.log('----');

  return html;
};