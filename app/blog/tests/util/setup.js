
module.exports = function () {
    const Express = require("express");
    const trace = require("helper/trace");
    const templates = require("templates");
    const blog = require('../../index');
    const sync = require("sync");

    global.test.blog();

    let server;
    const port = 8926;


  // Build the templates
  beforeAll(function(done) {
    templates({ watch: false }, done);
  })

  beforeEach(function() {

    this.write = async ({path, content}) => {
         await this.blog.write({path, content});
         await this.blog.rebuild();
    }

    this.get = (path, options = {}) => {
        return fetch(`${this.origin}${path}`, {
            ...options,
            headers: {
                ...options.headers,
                'X-Forwarded-Host': `${this.blog.handle}.localhost`,
            }
        });
    };

    this.remove = (path) => {
        return new Promise((resolve, reject) => {
          sync(this.blog.id, async (err, folder, callback) => {
            await this.blog.remove(path);
            folder.update(path, function (err) {
              if (err) return callback(err, reject);
              callback(null, resolve);
            });
          });
        });
    };

    this.write = ({path, content}) => {
        return new Promise((resolve, reject) => {
          sync(this.blog.id, async (err, folder, callback) => {
            await this.blog.write({ path, content });
            folder.update(path, function (err) {
              if (err) return callback(err, reject);
              callback(null, resolve);
            });
          });
        });
      };

      
    this.template = (views = [], package = {}) => {
      return new Promise((resolve, reject) => {
          sync(this.blog.id, async (err, folder, callback) => {
            await this.blog.remove("/Templates/local");

            await this.blog.write({
                path: "/Templates/local/package.json",
                content: JSON.stringify({
                    name: "local",
                    locals: {},
                    views: {},
                    enabled: true,
                    ...package
                  })
            });
  
            // views is an object with keys as the path and values as the content
            for (let path in views) {
              await this.blog.write({path: `/Templates/local/${path}`, content: views[path] });
            }

            folder.update("/Templates/local", function (err) {
              if (err) return callback(err, reject);
              callback(null, resolve);
            });
          });
        }); 
      };


      this.stream = async function ({ path, onStreamReady, expectedText, timeout = 4000 }) {
        const controller = new AbortController();
        const signal = controller.signal;
        const timer = setTimeout(() => {
          controller.abort();
          throw new Error(`Stream timed out after ${timeout}ms`);
        }, timeout); // Abort after timeout
    
        try {
            const res = await this.get(path, { signal });
            const reader = res.body?.pipeThrough(new TextDecoderStream()).getReader();
    
            if (!reader) throw new Error("Failed to get reader from response body");
    
            // Execute the onStreamReady callback if provided
            if (typeof onStreamReady === "function") {
                await onStreamReady();
            }
    
            // Process the stream
            while (true) {
                const { value, done } = await reader.read();
    
                if (done) break; // Exit if the stream is finished
    
                if (value && value.includes(expectedText)) {
                    await reader.cancel(); // Cancel the reader
                    controller.abort(); // Abort the fetch request
                    clearTimeout(timer); // Clear the timeout
                    return value; // Return the streamed content
                }
            }
    
            throw new Error(`Expected text "${expectedText}" not found in stream`);
        } finally {
            clearTimeout(timer); // Ensure timeout is cleared
        }
    };

    });
  
  // Create a webserver for testing remote files
  beforeAll(async function (done) {

    // Expose the server origin for the tests
    // specs so they can use this.origin 
    this.origin = `http://localhost:${port}`;

    const app = Express();

    // This lets us pretend the test is running over HTTPS
    app.use((req, res, next) => {
      req.headers["host"] = req.headers["x-forwarded-host"];
      req.headers["X-Forwarded-Proto"] = req.headers["X-Forwarded-Proto"] || "https";
      req.headers["x-forwarded-proto"] = req.headers["x-forwarded-proto"] || "https";
      next();
    });

    app.use(trace.init);

    // Trust proxy for secure cookies
    app.set("trust proxy", true);

    app.use(blog);

    // Start the server
    server = app.listen(port, () => {
      console.log(`Test server listening at ${this.origin}`);
      done();
    });

    server.on('error', (err) => {
      console.error("Error starting test server:", err);
      done.fail(err);
    });
  });

  afterAll(function(done) {
    console.log('Closing test server');
    server.close(() => {
        console.log('Test server closed');
        done();
    });
  });

};