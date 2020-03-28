var fs = require("fs");

function css() {
  var themes = fs.readdirSync(__dirname + "/themes");
  var publicCSS = "";

  function openCSS(id) {
    return "{{#plugins.codeHighlighting.options.theme." + id + "}}";
  }

  function closeCSS(id) {
    return openCSS(id)
      .split("{{#")
      .join("{{/");
  }

  themes.forEach(function(file) {
    if (file.indexOf(".") === 0) return;

    var id = file.slice(0, file.lastIndexOf("."));

    var css = fs.readFileSync(__dirname + "/themes/" + file, "utf-8");

    publicCSS += openCSS(id) + css + closeCSS(id);
  });

  fs.writeFileSync(__dirname + "/public.css", publicCSS, "utf-8");
}

function html() {
  var themes = fs.readdirSync(__dirname + "/themes");

  var formHTML =
    '<label style="margin-top:-0.5em" class="lightText noMargin">\n' +
    "Theme:&nbsp;&nbsp;" +
    '<select name="codeHighlighting.theme[select]" id="selectTheme">\n' +
    '<option {{theme.custom}} value="custom">– None –</option>\n';

  var htmlClose = "</select>\n" + "</label>\n";

  function optionHTML(id, name) {
    return (
      "<option {{theme." + id + '}} value="' + id + '">' + name + "</option>\n"
    );
  }

  themes.forEach(function(file) {
    if (file.indexOf(".") === 0) return;

    var id = file.slice(0, file.lastIndexOf("."));

    var name = id
      .split("_")
      .join(" ")
      .split("-")
      .join(" ");

    name = name.slice(0, 1).toUpperCase() + name.slice(1);

    var option = optionHTML(id, name);

    formHTML += option;
  });

  fs.writeFileSync(__dirname + "/form.html", formHTML + htmlClose, "utf-8");
}

css();
html();
