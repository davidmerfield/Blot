const child_process = require("child_process");
const config = require("config");
const fs = require("fs");

const pid = fs.readFileSync(config.pidfile, "utf-8");
child_process.execSync(`kill -s USR2 ${pid}`);
