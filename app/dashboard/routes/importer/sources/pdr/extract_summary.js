module.exports = function($) {
  return $("p")
    .first()
    .text()
    .trim();
};
