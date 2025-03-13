const config = require("config");

const clfdate = require("helper/clfdate");
const email = require("helper/email");
const scheduler = require("./scheduler");
const setup = require("./setup");
const server = require("./server");
const flush = require("documentation/tools/flush-cache");
const configureLocalBlogs = require("./configure-local-blogs");
const v8 = require('v8');
const heapStats = v8.getHeapStatistics();

console.log(clfdate(), `Starting server pid=${process.pid} environment=${config.environment}`);
console.log(clfdate(), 'Max heap size (MB):', heapStats.heap_size_limit / (1024 * 1024));

setup(async err => {
  if (err) throw err;

  // Flush the cache of documentation
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
