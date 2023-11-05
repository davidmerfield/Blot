const main = require("./main");

process.on("message", msg => {
  console.log("MESSAGE IN FORKED " + msg.chat);
  process.send({ chat: "HEYOOOOO" });
});
