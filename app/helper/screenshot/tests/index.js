const express = require("express");
const http = require("http");
const screenshot = require("../index.js");
const fs = require("fs-extra");
const hashFile = require('helper/hashFile');

describe("screenshot plugin", function () {
    let server;
    const port = 3000;
    const site = `http://localhost:${port}`;
    const path = __dirname + "/data/screenshot.png";
    const expectedPath = __dirname + "/expected.png";

    beforeAll((done) => {
        const app = express();
        app.get("/", (req, res) => {
            res.send("<html><head><style>body{background:white}</style></head><body><h1>Hello, world!</h1></body></html>");
        });

        server = http.createServer(app);
        server.listen(port, done);
    });

    afterAll((done) => {
        server.close(done);
    });

    it("works", async function () {
        const expectedHash = await hashFile(expectedPath);

        await screenshot(site, path);

        expect(fs.existsSync(path)).toBe(true);

        const hash = await hashFile(path);

        if (hash !== expectedHash) {
            throw new Error(`Screenshot does not match expected hash, please check ./data/screenshot.png`);
        }

        // cleanup for successful test
        fs.unlinkSync(path);
    }, 15000); // 15 seconds timeout
});
