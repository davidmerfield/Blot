describe("screenshot plugin", function () {
    const screenshot = require("../index.js");
    const fs = require("fs-extra");
    const hashFile = require('helper/hashFile');
    it("works", async function () {
        const site = "https://example.com";
        const path = __dirname + "/data/screenshot.png";
        const expectedPath = __dirname + "/expected.png";
        const expectedHash = await hashFile(expectedPath);

        await screenshot(site, path);
    
        expect(fs.existsSync(path)).toBe(true);

        const hash = await hashFile(path);

        if (hash !== expectedHash) {
            throw new Error(`Hash mismatch: ${hash} !== ${expectedHash}`);
        }

        // cleanup
        // fs.unlinkSync(path);
    }, 15000); // 10 seconds timeout
});
