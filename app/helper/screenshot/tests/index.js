describe("screenshot plugin", function () {
    const screenshot = require("../index.js");
    const fs = require("fs-extra");
    
    it("works", async function () {
        const site = "https://example.com";
        const path = __dirname + "/data/screenshot.png";
        const expectedPath = __dirname + "/expected.png";

        await screenshot(site, path);
    
        expect(fs.existsSync(path)).toBe(true);
        expect(fs.readFileSync(path)).toEqual(fs.readFileSync(expectedPath));

        // cleanup
        fs.unlinkSync(path);
    });
});
