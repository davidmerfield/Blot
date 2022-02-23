const express = require("express");
const app = new express();

const bull = require("bull");
const syncQueue = new bull("sync");

app.get("/", (req, res) => {
  console.log("served by", process.pid);
  res.send(`

    <h1>Hello!</h1>

    <form action="/sync" method="POST">
    <input type="submit" value="Trigger sync">
    </form>
  `);
});

app.post("/sync", async (req, res) => {
  console.log("served by", process.pid);
  console.log("syncing");
  const job = await syncQueue.add({
    blogID: "david",
  });
  console.log("added!");
  await job.finished();
  console.log("synced!");
  res.redirect("/");
});

module.exports = app;
