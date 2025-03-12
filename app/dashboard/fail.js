describe("Blot's dashboard'", function () {
    const site = require("site");
    const build = require("documentation/build");
    const templates = require("util").promisify(require("templates"));
    const fetch = require("node-fetch");
  
    global.test.blog();
  
    global.test.server(site);
  
    // we must build the views for the documentation
    // and the dashboard before we launch the server
    // we also build the templates into the cache
    beforeAll(async () => {
      console.log("Building views and templates");
      await build({ watch: false, skipZip: true });
      await templates({ watch: false });
    }, 60000);
  
    it("has no broken links for logged-in users", async function () {
      const email = this.user.email;
      const password = this.user.fakePassword;
  
      const params = new URLSearchParams();
  
      params.append("email", email);
      params.append("password", password);
  
      const res = await fetch(this.origin + "/sites/log-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        redirect: "manual",
      });
  
      const location = res.headers.get("location");
      const cookies = res.headers.raw()["set-cookie"];
  
      // the response status should be 302
      // and redirect to the dashboard
      expect(res.status).toEqual(302);
      expect(cookies.join(";")).toMatch(/connect.sid/);
      expect(location).toEqual(this.origin + "/sites");
  
      // Use the cookie to access the dashboard
      const cookieHeader = cookies
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
  
      // Check that we are logged in by requesting /sites and checking the response
      // for the user's email address
      const dashboard = await fetch(this.origin + "/sites", {
        headers: {
          Cookie: cookieHeader,
          redirect: "manual",
        },
      });
  
      // the response status should be 200
      expect(dashboard.status).toEqual(200);
  
      const dashboardText = await dashboard.text();
  
      expect(dashboardText).toMatch(email);
  
      console.log("Checking links for logged-in user");
  
      await global.test.brokenLinks(this.origin, {
        headers: {
          Cookie: cookieHeader,
        },
      });
    }, 60000);
  });
  