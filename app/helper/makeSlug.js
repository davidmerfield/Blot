var ensure = require("./ensure");
var MAX_LENGTH = 100;

// This must always return a string but it can be empty
function makeSlug(string) {
  var words;
  var trimmed = "";

  console.log
  ensure(string, "string");

  var slug = "";

  slug = string;

  // Remove query sluging
  if (slug.indexOf("?=") > -1) slug = slug.slice(0, slug.indexOf("?="));

  slug = slug
    .trim()
    .slice(0, MAX_LENGTH + 10)

    // Removes 'object replacement character' which unexpectedly
    // entered a file created on Ulysses. Perhaps an embedded image?
    .split(decodeURIComponent("%EF%BF%BC"))
    .join("")

    .toLowerCase()

    // remove common punction, basically everything except & _ and - /
    // Should we be stripping all &encoded; characters?
    .replace(/\%/g, "-percent")
    .replace(/&amp;/g, "and")
    .replace(/&nbsp;/g, " ")
    .replace(/&thinsp;/g, " ")
    .replace(/&mdash;/g, "-")
    .replace(/→/g, "to")
    .replace(/←/g, "from")
    .replace(/\./g, "-")
    .replace(
      /[\«\»\“\”\‘\–\’\`\~\!\@\#\$\%\^\&\*\(\)\+\=\\\|\]\}\{\[\'\"\;\:\?\>\.\<\,]/g,
      "-"
    )
    .replace(/[^[:alnum:]0-9_-\s]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes

  words = slug.split("-");
  trimmed = words.shift();

  for (var x = 0; x < words.length; x++) {
    if (trimmed.length + words[x].length > MAX_LENGTH) break;

    trimmed += "-" + words[x];
  }

  slug = trimmed;

  // remove internal leading and trailing hyphens, e.g. 
  // /-foo-/bar -> /foo/bar
  slug = slug
    .split("/")
    .map((str) => trimLeadingAndTrailing(str, ["-"]))
    .join("/");

  slug = trimLeadingAndTrailing(slug, ["-", "/"]);

  if (slug === "-") slug = "";

  slug = encodeURI(slug);

  slug = slug || "";

  return slug;
}

function trimLeadingAndTrailing(str, characters) {
  while (str.length > 1 && characters.indexOf(str[0]) > -1) str = str.slice(1);

  while (str.length > 1 && characters.indexOf(str.slice(-1)) > -1)
    str = str.slice(0, -1);

  return str;
}

var Is = require("./_is");
var is = Is(makeSlug);

is("!@#$^*()=+[]{}\\|;:'\",?><", "");
is("foo!@#$^*()=+[]{}\\|;:'\",?><bar", "foo-bar");

is("", "");
is("/", "/");
is("/a/", "a");
is("/a", "a");
is("a/", "a");
is("H", "h");
is(
  "HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHelloHello",
  "hellohellohellohellohellohellohellohellohellohellohellohellohellohellohellohellohellohellohellohellohellohello"
);
is("100% luck 15% skill", "100-percent-luck-15-percent-skill");
is("Hello", "hello");
is("Hello unicode: ", "hello-unicode-%EF%A3%BF");
is("/Hello/there/", "hello/there");
is("Hello/THIS/IS/SHIT", "hello/this/is/shit");
is("Hello This Is Me", "hello-this-is-me");
is("Hello?=l&=o", "hello");
is("123", "123");
is("1-2-3-4", "1-2-3-4");
is("12 34", "12-34");
is("f/ü/k", "f/%C3%BC/k");
is("微博", "%E5%BE%AE%E5%8D%9A");

is("/[design]/abc", "design/abc");

is("/[design](foo)/apple bc", "design-foo/apple-bc");

is(
  "remove object replacement character: ￼",
  "remove-object-replacement-character"
);

is(
  "Review of “The Development of William Butler Yeats” by V. K. Narayana Menon",
  "review-of-the-development-of-william-butler-yeats-by-v-k-narayana-menon"
);
is(
  "Review of The Development of William Butler Yeats by V. K. Narayana Menon Review of The Development offff William Butler Yeats by V. K. Narayana Menon",
  "review-of-the-development-of-william-butler-yeats-by-v-k-narayana-menon-review-of-the-development"
);
is(
  "AppleScript/Automator Folder Action to Convert Excel to CSV",
  "applescript/automator-folder-action-to-convert-excel-to-csv"
);

is("Peter Gregson – Bach recomposed: 6.6 Gigue","peter-gregson-bach-recomposed-6-6-gigue");

is("'xsb' command line error.", "xsb-command-line-error");
is("Foo & bar", "foo-bar");
is("Foo &amp; bar", "foo-and-bar");
is("Foo&thinsp;bar", "foo-bar");
is("China ← NYC → China", "china-from-nyc-to-china");
is("China+()[] ← NYC! → China", "china-from-nyc-to-china");
is("No more cd ../../", "no-more-cd");

is(
  "«&nbsp;French Tech Communauté&nbsp;»&nbsp;: quelle opportunité pour l’État&nbsp;?",
  "french-tech-communaut%C3%A9-quelle-opportunit%C3%A9-pour-l-%C3%A9tat"
);

module.exports = makeSlug;
