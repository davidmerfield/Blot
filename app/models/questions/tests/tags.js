const { stripTags } = require("blessed");

describe("questions.tags", function () {
  require("./setup")();

  const create = require("../create");
  const get = require("../get");
  const Tags = require("../tags");

  it("returns a list of the most popular tags", async function () {
    const first_question = await create({
      title: "First question",
      body: "This is the first question",
      tags: ["tag1", "tag2", "tag3"],
    });

    const second_question = await create({
      title: "Second question",
      body: "This is the second question",
      tags: ["tag2", "tag3"],
    });

    const third_question = await create({
      title: "Third question",
      body: "This is the third question",
      tags: ["tag3"],
    });

    const { tags, stats } = await Tags();

    expect(tags).toEqual([
      { tag: "tag3", count: 3 },
      { tag: "tag2", count: 2 },
      { tag: "tag1", count: 1 },
    ]);

    expect(stats).toEqual({
      total: 3,
      page_size: 10,
      page: 1,
    });
  });
});
