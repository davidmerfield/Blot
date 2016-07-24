module.exports = function (list) {
  list[0].first = true;
  list[list.length -1].last = true;
  return list;
}