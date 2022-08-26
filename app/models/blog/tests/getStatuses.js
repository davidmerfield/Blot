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
    console.log(statuses);
    expect(statuses.length).toEqual(3);
  });
});
