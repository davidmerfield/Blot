const helper = require("helper");
const titlecase = helper.titlecase;

function render($, callback) {
  try {
    $("h1, h2, h3, h4, h5, h6").each(function (i, el) {
      $(this).text(titlecase($(this).text()));
    });
  } catch (e) {}

  return callback();
}

module.exports = {
  render: render,
  isDefault: false,
  category: "Typography",
  title: "Titlecase",
  description: "Use Title Case for All Post Headings",
};
