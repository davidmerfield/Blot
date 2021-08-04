var basename = require("path").basename;
var fromPath = require("./dateStamp/fromPath");

function titlify(path) {
  var name, nameWithoutExtension, title;
  var hasDate = fromPath(path);

  // Otherwise basename doesn't work right?
  if (path[0] !== "/") path = "/" + path;

  // The filename is now just an extension, e.g. .jpg
  // so we set it to an empty string
  if (
    hasDate &&
    hasDate.fileName &&
    hasDate.fileName[0] !== "." &&
    hasDate.fileName.lastIndexOf(".") !== 0
  ) {
    name = hasDate.fileName;
  } else {
    name = basename(path);
  }

  // Remove tags
  if (name.indexOf("[") > -1 && name.indexOf("]") > -1) {
    name = name.replace(/(\[.*?\])/gm, "");
  }

  // Strip extension
  if (name.lastIndexOf(".") > -1) {
    nameWithoutExtension = name.slice(0, name.lastIndexOf("."));
  } else {
    nameWithoutExtension = name;
  }

  title = nameWithoutExtension.trim();

  // Replace dashes and underscores
  // with spaces to make things nice
  // but only if the file name doesn't
  // already contain spaces.
  if (title.indexOf(" ") === -1) {
    if (name.indexOf("-") > -1 && name.indexOf("_") > -1) {
      title = title.split("_").join(" ");
    } else {
      title = title.split("_").join(" ");
    }
  }

  // Remove leading and trailing dashes and slashes
  while (title[0] === "-" || title[0] === "_") title = title.slice(1);

  while (title.slice(-1) === "-" || title.slice(-1) === "_")
    title = title.slice(0, -1);

  title = title.trim() || nameWithoutExtension.trim() || name;

  return title;
}

function tests() {
  function is(str, expected) {
    if (titlify(str) !== expected) {
      console.log("INPUT", str);
      console.log("OUTPUT", titlify(str));
      console.log("EXPECTED", expected);
    }
  }

  // Preserve case
  is("/fOo.txt", "fOo");

  // Replace dashes and underscores
  // But only at start and end
  is("/-f_o_o-.txt", "f o o");

  // Preverve dashes
  is("/f-o-o.txt", "f-o-o");

  // Only replace dashes with spaces
  // when file name has no spaces.
  is("/2-1 Match report.txt", "2-1 Match report");
  is("/2-1_Match_report.txt", "2-1 Match report");

  // work without path
  is("test.md", "test");

  // work with multiple dots
  is("preview.html.txt", "preview.html");

  // extract date
  is("2016/1/2 Bar.txt", "Bar");
  is("2016-1/2 Bar.txt", "Bar");
  is("/2016-1 2 Bar.txt", "Bar");
  is("/2018-10-02-02-35 Hello.png", "Hello");

  // preserve date as title if no other characters exist
  is("/2016-1-2.txt", "2016-1-2");

  // extract tags
  is("[Foo] Apple.txt", "Apple");
  is("[Foo] Bar [Baz].txt", "Bar");
  is("[Foo]/[bar]/2016-1 2 Bar.txt", "Bar");

  // extract tags and date
  is("/2018-10-01-08-01 [nq] [mm] - mm upside.png", "mm upside");

  // Ignore bad date
  is("2-12-2000 Bar.txt", "2-12-2000 Bar");
  is("/2000/34-23 Bar.txt", "34-23 Bar");
  is("/11-1_Bar.txt", "11-1 Bar");

  // Ensure title exists
  is("___.jpg", "___");
  is("---.jpg", "---");
  is("-_-.jpg", "-_-");
  is(".jpg", ".jpg");
}

tests();

module.exports = titlify;
