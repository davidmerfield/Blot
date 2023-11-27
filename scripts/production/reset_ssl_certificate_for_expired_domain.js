const request = require("request");
const fs = require("fs-extra");
const CERT_DIR = "/etc/resty-auto-ssl/letsencrypt/certs";
const get = require("../get/blog");
const client = require("client");
const exec = require("child_process").exec;
const nginx = "/usr/local/openresty/bin/openresty";
const yesno = require("yesno");

// This doesn't work because of a cluster of permissions
// related issues but it should show you what needs to happen

if (!(process.getuid && process.getuid() === 0))
  throw new Error("This script must be run as root");

get(process.argv[2], function (err, user, blog) {
  const domain = blog.domain;

  if (!domain) throw new Error("blog does not have a domain");

  const secureURL = `https://${domain}`;
  const startsWithWWW = domain.indexOf("www.") === 0;
  const domainWithoutWWW = startsWithWWW ? domain.slice("www.".length) : domain;
  const domainWithWWW = startsWithWWW ? domain : "www." + domain;

  const certKeys = [
    `ssl:${domainWithoutWWW}:latest`,
    `ssl:${domainWithWWW}:latest`,
  ];

  const certDirs = [
    `${CERT_DIR}/${domainWithWWW}`,
    `${CERT_DIR}/${domainWithoutWWW}`,
  ];

  console.log("secureURL", secureURL);
  console.log("domainWithWWW:", domainWithWWW);
  console.log("domainWithoutWWW:", domainWithoutWWW);
  console.log("Keys to drop:", certKeys);
  console.log("Directories to remove:", certDirs);

  yesno.ask("Proceed? (y/n)", false, function (ok) {
    if (!ok) throw "Not ok!";

    certDirs.forEach((dir) => fs.removeSync(dir));

    console.log("removed certificate dirs", certDirs);

    client.del(certKeys, function (err) {
      if (err) throw err;

      console.log("removed redis keys", certKeys);

      exec(`${nginx} -s reload`, function (err, stdout) {
        if (err) throw err;
        console.log(stdout);
        console.log("restarted nginx");

        request(secureURL, function (err) {
          if (err) throw err;
          console.log("certificate renewed successfully");
          process.exit();
        });
      });
    });
  });
});
