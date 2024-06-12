const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport");

describe("Blot's site'", function () {
    const site = require("site");
    const build = require("documentation/build");
    const templates = require('util').promisify(require("templates"));
    const fetch = require("node-fetch");
    const detectUnusedCSS = require('./util/detectUnusedCSS');
    const { create } = require("models/question");

    global.test.blog();
  
    global.test.server(site);

    // we must build the views for the documentation
    // and the dashboard before we launch the server
    // we also build the templates into the cache
    beforeAll(async () => {
      await build({watch: false});
      await templates({watch: false});

      const question = {
        title: "How do I use Blot's API?",
        author: "Blot",
        body: "I want to use Blot's API to create a new post. How do I do that?",
        tags: ["api"],
        replies: [
          {
            body: "You can create a new post by sending a POST request to /api/posts with the post's title and body."
          }
        ]
      };

      // inject some fake questions into the database
      const { id } = await create({
        title: question.title,
        author: question.author,
        body: question.body,
        tags: question.tags
      });
  
      for (const reply of question.replies) {
        await create({
          body: reply.body,
          parent: id
        });
      }

    }, 60000);

    it("has no unused CSS", async function () {
      const email = this.user.email;
      const password = this.user.fakePassword;
      
      const params = new URLSearchParams();

      params.append('email', email);
      params.append('password', password);

      const res = await fetch(this.origin + "/sites/log-in", {
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
        redirect: 'manual'
      });

      const location = res.headers.get("location");
      const cookies = res.headers.raw()['set-cookie'];

      // the response status should be 302
      // and redirect to the dashboard
      expect(res.status).toEqual(302);
      expect(cookies.join(';')).toMatch(/connect.sid/);
      expect(location).toEqual(this.origin + "/sites");

      // Use the cookie to access the dashboard
      const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
      
      // Check that we are logged in by requesting /sites and checking the response
      // for the user's email address
      const dashboard = await fetch(this.origin + "/sites", {headers: {
        'Cookie': cookieHeader,
        redirect: 'manual'
      }});

      // the response status should be 200
      expect(dashboard.status).toEqual(200);

      await detectUnusedCSS({
        origin: this.origin, 
        headers: {
        'Cookie': cookieHeader,
        }
        });

    }, 60000);
  });
  
  
  