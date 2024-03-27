const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

if (!process.env.CONTAINER_PATH) {
  console.error("CONTAINER_PATH environment variable is not set");
  process.exit(1);
}

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

const nodeModules = new RegExp(/^(?:.*[\\\/])?node_modules(?:[\\\/].*)?$/);

const dirnamePlugin = {
  name: "dirname",

  setup (build) {
    // Intercept all import paths inside './app'
    build.onLoad({ filter: /app\/.*/ }, ({ path: filePath }) => {
      // If the file is not in node_modules, read it and replace __dirname and __filename
      if (!filePath.match(nodeModules)) {
        let contents = fs.readFileSync(filePath, "utf8");
        const loader = path.extname(filePath).substring(1);
        const dirname = path.dirname(filePath);
        const dirnameInDockerContainer =
          process.env.CONTAINER_PATH +
          dirname.slice(path.dirname(__dirname).length);
        contents = contents.replace(
          /\_\_dirname/g,
          `'${dirnameInDockerContainer}'`
        );
        return {
          contents,
          loader
        };
      }
    });
  }
};

async function watch () {
  let ctx = await esbuild.context({
    entryPoints: ["./app/local.js"],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: "node",
    target: "node16", // Set this to your desired Node.js version
    outfile: "./data/app.js",
    define: {
      "process.env.NODE_APP": '"./app"'
    },
    logLevel: "info",
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
      ...Object.keys(require("../package.json").dependencies)
    ],
    resolveExtensions: [".js", ".json"],
    alias: createAliasMap("./app", ""),
    plugins: [dirnamePlugin]
  });
  await ctx.watch();
}

watch();
