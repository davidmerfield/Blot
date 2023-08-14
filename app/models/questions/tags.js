const client = require("models/client");
const keys = require("./keys");
const PAGE_SIZE = 10;

// returns tags, sorted by popularity
// paginated by PAGE_SIZE

module.exports = ({ page = 1 } = {}) => {
  return new Promise((resolve, reject) => {
    client.smembers(keys.tags, (err, tags) => {
      const batch = client.batch();

      for (const tag of tags) {
        batch.zcard(keys.list.tag(tag));
      }

      batch.exec((err, counts) => {
        const tagsWithCounts = tags.map((tag, i) => {
          return {
            tag,
            count: counts[i],
          };
        });

        const sortedTags = tagsWithCounts.sort((a, b) => {
          return b.count - a.count;
        });

        const pageOfTags = sortedTags.slice(
          (page - 1) * PAGE_SIZE,
          page * PAGE_SIZE
        );

        resolve(pageOfTags);
      });
    });
  });
};
