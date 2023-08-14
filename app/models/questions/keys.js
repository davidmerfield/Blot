module.exports = {
  id: "blot:questions:id",
  question: (id) => `blot:questions:id:${id}`,
  replies: (parent_id) => `blot:questions:replies:${parent_id}`,
  list: {
    tag: (tag) => `blot:questions:list:tag:${tag}`,
    date: "blot:questions:list:date",
    replies: "blot:questions:list:replies",
  }
};
