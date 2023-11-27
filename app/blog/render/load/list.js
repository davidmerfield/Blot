module.exports = function (list) {
  if (list.length) {
    list[list.length - 1].last = true;
    list[0].first = true;
  }

  if (list.length > 2) {
    list[list.length - 2].penultimate = true;
  }

  // Should I do a zero-based index or not?
  // Decide before documenting this. Beware
  // if you use this in your theme before then.
  list = list.map(function (el, i) {
    el.position = i + 1;
    return el;
  });

  return list;
};
