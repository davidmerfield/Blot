var map = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹'
};

document.querySelectorAll('sup').forEach(function(el){
  var html = el.innerHTML;

  for (var glyph in map) {
    html = html.split(glyph).join(map[glyph]);
  }

  el.innerHTML = html;
});