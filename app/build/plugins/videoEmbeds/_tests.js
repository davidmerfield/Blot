var videoEmbed = require("./index");
var cheerio = require("cheerio");
var assert = require("assert");

console.log("running tests");

function is(html, expected) {
  var $ = cheerio.load(html, { decodeEntities: false });

  var callback = function(output) {
    try {
      assert.deepEqual(output, expected);
    } catch (e) {
      console.log("fail: " + html);
      console.log(output);
    }
  };

  videoEmbed.render(html, callback, $, {});
}

function link(url) {
  return '<a href="' + url + '">' + url + "</a>";
}

var wideVideo = "https://www.youtube.com/watch?v=YaT_5KoGh1Q";
var exp =
  '<div class="videoContainer" style="padding-bottom:56.25%"><iframe src="https://www.youtube.com/embed/YaT_5KoGh1Q?rel=0&wmode=transparent&rel=0&autohide=1&showinfo=0" frameborder="0" allowfullscreen></iframe></div>';

is("<div>" + link(wideVideo) + "</div>", exp);
is(link(wideVideo), exp);
is(
  "<p>" + link(wideVideo) + "</p>",
  '<div class="videoContainer" style="padding-bottom:56.25%"><iframe src="https://www.youtube.com/embed/YaT_5KoGh1Q?rel=0&wmode=transparent&rel=0&autohide=1&showinfo=0" frameborder="0" allowfullscreen></iframe></div>'
);
is(
  "<p>Hello: " + link(wideVideo) + " bye...</p>",
  '<p>Hello:  bye...</p><div class="videoContainer" style="padding-bottom:56.25%"><iframe src="https://www.youtube.com/embed/YaT_5KoGh1Q?rel=0&wmode=transparent&rel=0&autohide=1&showinfo=0" frameborder="0" allowfullscreen></iframe></div>'
);

var vid2 = "https://www.youtube.com/watch?v=MJ62hh0a9U4";
var vid2Alt = "http://youtube.com/watch?v=MJ62hh0a9U4";

var exp2 =
  '<div class="videoContainer" style="padding-bottom:75%"><iframe src="https://www.youtube.com/embed/MJ62hh0a9U4?rel=0&wmode=transparent&rel=0&autohide=1&showinfo=0" frameborder="0" allowfullscreen></iframe></div>';

is('<a href="' + vid2 + '">' + vid2 + "</a>", exp2);
is('<a href="' + vid2Alt + '">' + vid2Alt + "</a>", exp2);

var vimeoVid = "https://vimeo.com/87952436";
var exp3 =
  '<div class="videoContainer vimeo" style="padding-bottom: 56.25%"><iframe src="//player.vimeo.com/video/87952436?badge=0&color=ffffff&byline=0&portrait=0" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen></iframe></div>';

is(link(vimeoVid), exp3);

var bad1 = "http://foo.com";
var bad2 = "https://www.youtube.com/watch?v=*(&*^%";
var bad3 = "http://youtube.com/watch";
var bad4 = "https://vimeo.com/^*%&^*(";

is(link(bad1), link(bad1));
is(link(bad2), link(bad2));
is(link(bad3), link(bad3));
is(link(bad4), link(bad4));
