const pathToLogFile = process.argv[2];
const { line } = require("blessed");
const fs = require("fs");
const { url } = require("inspector");

// log lines have the following format:
// MISS|403|1694132016249|1552|1534983|0.0.0.0|https://www.nitinpai.in/2004/03/08/protectionism-in-education-leads-to-outsourcing|https://cdn.blot.im/blog_bf874f607a0b497face3a11ef5d1b9ac/_avatars/adead65f-0316-497c-a9fa-acb339c406fc.png|SG|Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)|bfd7e1cf106dd54900f5d93ca70f9f6f|SG
// please extract the URL from the log line
const urls = fs
  .readFileSync(pathToLogFile, "utf8")
  .split("\n")
  // only items where status is 404
  .filter((line) => line.split("|")[1] === "404")
  .map((line) => line.split("|")[7]);

fs.writeFileSync("urls.txt", urls.join("\n"));
