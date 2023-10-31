const express = require("express");
const app = express();

app.use((req, res, next) => {
  res.send("Hello Node!");
});

module.exports = ({ port }) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      resolve(server);
    });
  });
};
