describe("questions.create", function () {
  require("./setup")();
  const create = require("../create");

  it("creates a question", async function () {
    const question = await create({ title: "How?", body: "Yes" });

    expect(question.id).toEqual(jasmine.any(String));
    expect(question.title).toEqual("How?");
    expect(question.body).toEqual("Yes");
    expect(question.tags).toEqual([]);
  });

  it("respects the ID you supply it as long as it is not new", async function () {
    const question = await create({
      id: "123",
      title: "How?",
      body: "Yes",
    });

    expect(question.id).toEqual("123");
    expect(question.title).toEqual("How?");
    expect(question.body).toEqual("Yes");
    expect(question.tags).toEqual([]);
  });

  it("saves tags if you supply them", async function () {
    const question = await create({
      title: "How?",
      body: "Yes",
      tags: ["a", "b"],
    });

    expect(question.id).toEqual(jasmine.any(String));
    expect(question.title).toEqual("How?");
    expect(question.body).toEqual("Yes");
    expect(question.tags).toEqual(["a", "b"]);
  });
});
