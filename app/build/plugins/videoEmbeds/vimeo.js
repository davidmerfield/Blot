const fetch = require("node-fetch");
const { parse } = require("url");

var FAIL = "Could not retrieve video properties";

module.exports = async function (href, callback) {
  try {
    const { hostname, pathname } = parse(href);

    if (!hostname || !hostname.match(/vimeo.com$/)) throw new Error(FAIL);

    // parse the video id from the url, even if it has a trailing slash
    const id = pathname.match(/\/(\d+)\/?$/)[1];

    if (!id) throw new Error(FAIL);

    const res = await fetch("https://vimeo.com/api/v2/video/" + id + ".json");
    const body = await res.json();

    const el = body[0];

    if (!el || !el.width || !el.height) throw new Error(FAIL);

    const thumbnail = el.thumbnail_large + ".jpg";
    const height = el.height;
    const width = el.width;
    const ratio = (height / width) * 100;

    // we prepend a zero-width char because of a weird fucking
    // bug on mobile safari where if the embed is the first child,
    // the video player will not show. This causes issues with
    // inline elements displaying (adds extra space) solution needed
    // that doesn't disrupt page layout...
    const embedHTML = `<div style="width:0;height:0"> </div><div class="videoContainer vimeo" style="padding-bottom: ${ratio}%" ><iframe data-thumbnail="${thumbnail}" src="//player.vimeo.com/video/${id}?badge=0&color=ffffff&byline=0&portrait=0" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>`;

    return callback(null, embedHTML);
  } catch (e) {
    return callback(new Error(FAIL));
  }
};
