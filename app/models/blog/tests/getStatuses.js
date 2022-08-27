describe("Blog.setStatus", function () {
  const { promisify } = require("util");
  const get = promisify(require("../get"));
  const setStatus = promisify(require("../setStatus"));
  const getStatuses = promisify(require("../getStatuses"));

  // Create a test user before each spec
  global.test.blog();

  it("gets statuses", async function () {
    const messages = ["Hey", "You", "David"];
    for (const message of messages) await setStatus(this.blog.id, { message });
    const statuses = await getStatuses(this.blog.id);
    expect(statuses.length).toEqual(messages.length);
  });

  it("gets pages of statuses", async function () {
    const totalMessages = 1000;
    const messages = [];
    while (messages.length < totalMessages)
      messages.push(global.test.fake.lorem.sentence());

    for (const message of messages) await setStatus(this.blog.id, { message });

    const statuses = await getStatuses(this.blog.id);

    expect(statuses.length).toEqual(100);
    expect(statuses[0].message).toEqual(messages.at(-1));

    const secondPage = await getStatuses(this.blog.id, {page: 2});

    expect(secondPage.length).toEqual(100);

    const shortPage = await getStatuses(this.blog.id, {page: 1, pageSize: 10});

    expect(shortPage.length).toEqual(10);
    expect(shortPage[0].message).toEqual(messages.at(-1));
    expect(shortPage.at(-1).message).toEqual(messages.at(-10));
  });
});
