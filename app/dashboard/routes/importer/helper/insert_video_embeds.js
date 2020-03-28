module.exports = function(content) {
  content = youtube(content);
  content = addVimeo(content);
  content = addOtherVimeo(content);

  return content;
};

function youtube(str) {
  var reg = /\[youtube ([^\s]+)\]/g;
  var matches = reg.exec(str);

  if (matches && matches.length) {
    var repl = matches[0];
    var video_url = matches[1];

    video_url = video_url.slice(0, video_url.indexOf("&amp;"));

    str = str.split(repl).join("</p><p>" + video_url + "</p><p>");

    return youtube(str);
  } else {
    return str;
  }
}

function addOtherVimeo(str) {
  var reg = /\[vimeo ([^\s]+) w=([^\s]+)\]/g;
  var matches = reg.exec(str);

  if (matches && matches.length) {
    var repl = matches[0];
    var video_url = matches[1];

    str = str.split(repl).join("</p><p>" + video_url + "</p><p>");

    return addOtherVimeo(str);
  } else {
    return str;
  }
}

function addVimeo(str) {
  var reg = /\[vimeo ([0-9]+) w=([0-9]+) h=([0-9]+)\]/g;
  var matches = reg.exec(str);

  if (matches && matches.length) {
    var repl = matches[0];
    var id = matches[1];

    str = str
      .split(repl)
      .join("</p><p>https://www.vimeo.com/" + id + "</p><p>");

    return addVimeo(str);
  } else {
    return str;
  }
}
