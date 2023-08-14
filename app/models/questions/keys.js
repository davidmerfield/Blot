module.exports = {
  id: "blot:questions:id",
  question: (id) => `blot:questions:${id}`,
  list: {
    tag: (tag) => `blot:questions:list:tag:${tag}`,
    date: "blot:questions:list:date",
    replies: "blot:questions:list:replies",
  }
};
