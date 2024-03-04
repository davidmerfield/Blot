const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// Function to recursively get all the files in a directory
function getFiles (dir, files_) {
  files_ = files_ || [];
  const files = fs.readdirSync(dir);

  for (const i in files) {
    const name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
}

// Function to create alias object for all files in a given directory
function createAliasMap (directory, namespace) {
  const files = getFiles(directory);
  const alias = {};

  files.forEach(file => {
    // if the file is not js skip
    if (!file.endsWith(".js")) {
      return;
    }

    let modulePath = path.relative(directory, file).replace(/\\/g, "/");
    // Check if the file is an index.js inside a directory and adjust the path
    if (modulePath.endsWith("/index.js")) {
      modulePath = modulePath.substring(
        0,
        modulePath.length - "/index.js".length
      );
    } else {
      // Remove the file extension for non-index.js files
      modulePath = modulePath.replace(/\.js$/, "");
    }
    // Construct the module name by prepending the namespace and ensuring no leading slash
    const moduleName = path.join(namespace, modulePath).replace(/^\/+/, "");
    // Construct the full path to the module file
    const fullPath = path.join(directory, modulePath).replace(/^\/+/, "./");
    alias[moduleName] = "./" + fullPath;
  });

  return alias;
}

const alias = {
  ...createAliasMap("./app", "")
  // Add other aliases here if necessary
};

const nodeModules = new RegExp(/^(?:.*[\\\/])?node_modules(?:[\\\/].*)?$/);

const dirnamePlugin = {
  name: "dirname",

  setup (build) {
    build.onLoad({ filter: /.*/ }, ({ path: filePath }) => {
      if (!filePath.match(nodeModules)) {
        let contents = fs.readFileSync(filePath, "utf8");
        const loader = path.extname(filePath).substring(1);
        const dirname = path.dirname(filePath);
        contents = contents
          .replace("__dirname", `"${dirname}"`)
          .replace("__filename", `"${filePath}"`);
        return {
          contents,
          loader
        };
      }
    });
  }
};
esbuild
  .build({
    entryPoints: ["./app/local.js"],
    bundle: true,
    platform: "node",
    target: "node16", // Set this to your desired Node.js version
    outfile: "./data/app.js",
    define: {
      "process.env.NODE_APP": '"./app"'
    },
    external: [
      "fsevents",
      "http-proxy",
      "passport",
      "electron",
      "typescript",
      "jquery",
      "sharp",
      "puppeteer",
      "./domprops.json",
      ...Object.keys(require("./package.json").dependencies)
    ], // This line marks `fsevents` as external
    resolveExtensions: [".js", ".json"],
    alias,
    plugins: [dirnamePlugin]
  })
  .then(() => {
    console.log("Build completed successfully!");
  })
  .catch(error => {
    console.error("Build failed:", error.message);
    process.exit(1);
  });
