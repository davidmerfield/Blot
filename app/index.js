const config = require("config");

const clfdate = require("helper/clfdate");
const email = require("helper/email");
const scheduler = require("./scheduler");
const setup = require("./setup");
const server = require("./server");
const flush = require("documentation/tools/flush-cache");
const configureLocalBlogs = require("./configure-local-blogs");

const CONTAINER_NAME = process.env.CONTAINER_NAME;

console.log(clfdate(), `Starting server pid=${process.pid} environment=${config.environment}`);

setup(async err => {
  if (err) throw err;

  // Flush the cache of documentation
  flush();

  // This is the master process
  if (CONTAINER_NAME === 'blot-container-green') {

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

  email.SERVER_START();

  // Open the server to handle requests
  server.listen(config.port, function () {
    console.log(
      clfdate(),
      `Server listening pid=${process.pid} port=${config.port}`
    );

    console.log(clfdate(), "Finished setting up server");
    
    if (config.environment === "development") {
      configureLocalBlogs();
    } 
    
  });
});
