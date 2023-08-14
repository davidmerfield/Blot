describe("questions.list", function () {
  require("./setup")();

  const create = require("../create");
  const get = require("../get");
  const list = require("../list");

  it("lists questions in the order they were created, most recent first", async function () {
    const first_id = await create({ title: "How?", body: "Yes" });
    const second_id = await create({ title: "How?", body: "Yes" });
    const third_id = await create({ title: "How?", body: "Yes" });

    const questions = await list();

    expect(questions.length).toBe(3);
    expect(questions[0].id).toBe(third_id);
    expect(questions[1].id).toBe(second_id);
    expect(questions[2].id).toBe(first_id);
  });

  it("paginates questions with a default page size of 10", async function () {
    for (let i = 0; i < 15; i++) {
      await create({ title: "How?", body: "Yes" });
    }

    const questions = await list();

    expect(questions.length).toBe(10);

    const page_two = await list({ page: 2 });

    expect(page_two.length).toBe(5);
  });

  it("lets you list the questions with a given tag", async function () {
    const first_id = await create({
      title: "How?",
      body: "Yes",
      tags: ["tag1", "tag2"],
    });
    const second_id = await create({
      title: "How?",
      body: "Yes",
      tags: ["tag1", "tag3"],
    });
    const third_id = await create({
      title: "How?",
      body: "Yes",
      tags: ["tag2", "tag3"],
    });

    const questions = await list({ tag: "tag1" });

    expect(questions.length).toBe(2);
    expect(questions[0].id).toBe(second_id);
    expect(questions[1].id).toBe(first_id);
  });
});
