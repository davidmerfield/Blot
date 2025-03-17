const config = require("config");
const clfdate = require("helper/clfdate");
const email = require("helper/email");
const setup = require("./setup");
const server = require("./server");

console.log(clfdate(), `Starting server env=${config.environment}`);
setup(async (err) => {
  if (err) throw err;

  console.log(clfdate(), "Finished setting up server");

  // Open the server to handle requests
  server.listen(config.port, function () {
    console.log(clfdate(), `Server listening`);
    
    // Send an email notification if the server starts or restarts
    email.SERVER_START(null, { container: config.container });
  });
});
