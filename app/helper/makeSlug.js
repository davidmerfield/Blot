var ensure = require("./ensure");
var MAX_LENGTH = 100;

// This must always return a string but it can be empty
function makeSlug(string) {
  var words,
    components,
    trimmed = "";

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

    .replace(/\%/g, "-percent")
    .replace(/&amp;/g, "and")
    .replace(/→/g, "to")
    .replace(/←/g, "from")
    .replace(/\./g, "-")
    .replace(
      /[\“\”\‘\’\`\~\!\@\#\$\%\^\&\*\(\)\+\=\\\|\]\}\{\[\'\"\;\:\?\>\.\<\,]/g,
      ""
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

  // Remove leading and trailing
  // slashes and dashes.

  while (slug.length > 1 && (slug[0] === "/" || slug[0] === "-"))
    slug = slug.slice(1);

  while (slug.length > 1 && (slug.slice(-1) === "/" || slug.slice(-1) === "-"))
    slug = slug.slice(0, -1);

  slug = encodeURI(slug);

  slug = slug || "";

  return slug;
}

var Is = require("./is");
var is = Is(makeSlug);

is("!@#$^*()=+[]{}\\|;:'\",?><", "");
is("foo!@#$^*()=+[]{}\\|;:'\",?><bar", "foobar");

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
is("'xsb' command line error.", "xsb-command-line-error");
is("Foo & bar", "foo-bar");
is("Foo &amp; bar", "foo-and-bar");
is("China ← NYC → China", "china-from-nyc-to-china");
is("Chin+a()[] ← NY!C → China", "china-from-nyc-to-china");
is("No more cd ../../", "no-more-cd");

module.exports = makeSlug;
