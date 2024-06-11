module.exports = function(){
    const LONG_TIMEOUT = 60000;
    const site = require("site");
    const build = require("documentation/build");
    const templates = require('util').promisify(require("templates"));

    global.test.server(site);

    // we must build the views for the documentation
    // and the dashboard before we launch the server
    // we also build the templates into the cache
    beforeAll(async () => {
        await build({watch: false});
        await templates({watch: false});
    }, LONG_TIMEOUT);

    // increase the timeout for all tests
    beforeEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = LONG_TIMEOUT;
    });

    // reset the timeout after each test
    afterEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
    });
}