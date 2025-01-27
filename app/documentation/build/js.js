const { build } = require("esbuild");
const { join } = require("path");
 


module.exports = ({source, destination}) => async () => {
    await build({
      entryPoints: [join(source, "js/documentation.js")],
      bundle: true,
      minify: true,
      // sourcemap: true,
      target: ["chrome58", "firefox57", "safari11", "edge16"],
      outfile: join(destination, "documentation.min.js")
    });
    
    console.log('built documentation.min.js');
    
    await build({
      entryPoints: [join(source, "js/dashboard.js")],
      bundle: true,
      minify: true,
      // sourcemap: true,
      target: ["chrome58", "firefox57", "safari11", "edge16"],
      outfile: join(destination, "dashboard.min.js")
    });
    
    console.log('built dashboard.min.js');
  }
  
  