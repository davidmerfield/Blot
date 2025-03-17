const config = require("config");

const clfdate = require("helper/clfdate");
const email = require("helper/email");
const scheduler = require("./scheduler");
const setup = require("./setup");
const server = require("./server");
const flush = require("documentation/tools/flush-cache");
const configureLocalBlogs = require("./configure-local-blogs");

console.log(clfdate(), `Starting server`);

setup(async (err) => {
  if (err) throw err;

  // Flush the cache of the public site and documentation
  flush();

  // This is the master process
  if (config.master) {
    // Launch scheduler for background tasks, like backups, emails
    scheduler();

    // Run any initialization that clients need
    // Google Drive will renew any webhooks, e.g.
    for (const { init, display_name } of Object.values(require("clients"))) {
      if (init) {
        console.log(clfdate(), display_name + " client:", "Initializing");
        init();
      }
    }
  }

  // Send an email notification if the server starts or restarts
  email.SERVER_START(null, { container: config.container });

  console.log(clfdate(), "Finished setting up server");

  // Open the server to handle requests
  server.listen(config.port, function () {
    console.log(clfdate(), `Server listening`);

    if (config.environment === "development") {
      configureLocalBlogs();
    }
  });
});
