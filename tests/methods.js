var Blog = require('../app/models/blog');

console.time("get");

Blog.getHosts(function (err, hosts) {

  if (err) throw err;

  console.log(hosts);
  console.timeEnd("get");
});