describe("Blog.setStatus", function () {
  const { promisify } = require("util");
  const get = promisify(require("../get"));
  const setStatus = promisify(require("../setStatus"));

  // Create a test user before each spec
  global.test.blog();

  it("sets a status", async function () {
    const status = {
      error: false,
      syncing: false,
      message: "Hey",
      datestamp: Date.now(),
    };
    await setStatus(this.blog.id, status);
    const blog = await get({ id: this.blog.id });
    expect(blog.status).toEqual(status);
  });

  it("fills in default values for a status", async function () {
    await setStatus(this.blog.id, { message: "Hey" });
    let { status } = await get({ id: this.blog.id });
    expect(status.error).toEqual(false);
    expect(status.syncing).toEqual(false);
    expect(status.datestamp).toEqual(jasmine.any(Number));
  });

  it("overwrites an existing status", async function () {
    await setStatus(this.blog.id, { message: "First" });
    let blog = await get({ id: this.blog.id });
    const firstStatus = blog.status;
    expect(firstStatus.message).toEqual("First");
    await setStatus(this.blog.id, { message: "Second" });
    blog = await get({ id: this.blog.id });
    const secondStatus = blog.status;
    expect(secondStatus.message).toEqual("Second");
  });

  it("throws errors when the blogID is not passed", async function () {
    const status = {
      error: false,
      syncing: false,
      message: "Hey",
      datestamp: Date.now(),
    };

    // Missing blog id
    await expectAsync(setStatus()).toBeRejected();
    await expectAsync(setStatus(status)).toBeRejected();
    await expectAsync(setStatus(null, status)).toBeRejected();
    await expectAsync(setStatus(undefined, status)).toBeRejected();

    // Invalid blog id
    await expectAsync(setStatus(1, status)).toBeRejected();
    await expectAsync(setStatus(() => {}, status)).toBeRejected();
    await expectAsync(setStatus({}, status)).toBeRejected();

    // Sanity check
    await expectAsync(setStatus(this.blog.id, status)).not.toBeRejected();
  });

  it("throws errors when the status format is unexpected", async function () {
    await expectAsync(setStatus(this.blog.id, { error: 1 })).toBeRejected();

    await expectAsync(
      setStatus(this.blog.id, { message: null, error: true })
    ).toBeRejected();

    await expectAsync(setStatus(this.blog.id, {})).toBeRejected();
    await expectAsync(
      setStatus(this.blog.id, {
        error: false,
        syncing: true,
        message: null,
      })
    ).toBeRejected();
  });
});
