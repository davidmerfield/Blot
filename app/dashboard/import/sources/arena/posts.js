const request = require("request");
const PAGE_SIZE = 100;

module.exports = function posts({ slug, status }) {
  return new Promise((resolve, reject) => {
    var page = 0;
    var posts = [];
    var new_posts;

    status(`Fetching page ${page + 1} of channel`);
    request(base(slug, page), function with_page(err, body, res) {
      if (err) return reject(err);

      new_posts = JSON.parse(res).contents;

      posts = posts.concat(new_posts);

      if (!new_posts.length) {
        status(`Fetched everything on channel`);
        return resolve(posts);
      }

      page++;

      status(`Fetching page ${page + 1} of channel`);
      request(base(slug, page), with_page);
    });
  });
};

function base(slug, page) {
  return (
    "https://api.are.na/v2/channels/" +
    slug +
    "/contents?direction=desc&sort=position&per=" +
    PAGE_SIZE +
    "&channel_slug=" +
    slug +
    "&page=" +
    page
  );
}
