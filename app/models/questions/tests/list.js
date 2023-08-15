describe("questions.list", function () {
  require("./setup")();

  const create = require("../create");
  const list = require("../list");

  it("lists questions in the order they were created, most recent first", async function () {
    const first = await create({ title: "How?", body: "Yes" });
    const second = await create({ title: "How?", body: "Yes" });
    const third = await create({ title: "How?", body: "Yes" });

    const { questions } = await list();

    expect(questions.length).toBe(3);
    expect(questions[0].id).toBe(third.id);
    expect(questions[1].id).toBe(second.id);
    expect(questions[2].id).toBe(first.id);
  });

  it("paginates questions with a default page size of 10", async function () {
    for (let i = 0; i < 15; i++) {
      await create({ title: "How?", body: "Yes" });
    }

    const { questions, stats } = await list();

    expect(stats.total).toBe(15);
    expect(questions.length).toBe(10);

    const page_two = await list({ page: 2 });

    expect(page_two.questions.length).toBe(5);
  });

  it("lets you list the questions with a given tag", async function () {
    const first = await create({ title: "How?", body: "Yes", tags: ["foo"] });
    const second = await create({ title: "How?", body: "Yes", tags: ["bar"] });
    const third = await create({ title: "How?", body: "Yes", tags: ["foo"] });

    const { questions } = await list({ tag: "foo" });

    expect(questions.length).toBe(2);
    expect(questions[0].id).toBe(third.id);
    expect(questions[1].id).toBe(first.id);
  });
});
