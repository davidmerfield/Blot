const createUser = require("./createUser");
const removeUser = require("./removeUser");

const createBlog = require("./createBlog");
const removeBlog = require("./removeBlog");

const site = require("site");
const server = require("./server");
const build = require("documentation/build");
const templates = require("util").promisify(require("templates"));

module.exports = function (options = {}) {
  // we must build the views for the documentation
  // and the dashboard before we launch the server
  // we also build the templates into the cache
  beforeAll(async () => {
    console.log("Building views and templates");
    await build({ watch: false, skipZip: true });
    await templates({ watch: false });
  }, 60000);

  beforeEach(createUser);
  afterEach(removeUser);

  beforeEach(createBlog);
  afterEach(removeBlog);

  server(site);

  if (options.login) {
    beforeEach(async function () {
      const email = this.user.email;
      const password = this.user.fakePassword;

      const params = new URLSearchParams();

      params.append("email", email);
      params.append("password", password);

      const res = await this.fetch("/sites/log-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        redirect: "manual",
      });

      const headers = Object.fromEntries(res.headers);

      const location = headers.location;
      const Cookie = headers["set-cookie"];

      // the response status should be 302
      // and redirect to the dashboard
      expect(res.status).toEqual(302);
      expect(Cookie).toMatch(/connect.sid/);
      expect(location).toEqual("/sites");

      // Expose the cookie to the test context so this.fetch can use it
      this.Cookie = Cookie;

      // Check that we are logged in by requesting /sites and checking the response
      // for the user's email address
      const dashboard = await this.fetch("/sites", {
        redirect: "manual",
      });

      // the response status should be 200
      expect(dashboard.status).toEqual(200);

      const dashboardText = await dashboard.text();

      expect(dashboardText).toMatch(email);

      console.log("Checking links for logged-in user");
    });
  }
};
