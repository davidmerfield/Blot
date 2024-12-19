const { spawn, spawnSync } = require('child_process');

const runWithXvfb = async (site, path, options = {}) => {
  return new Promise((resolve, reject) => {
    // Log the input to check values
    console.log('Running Xvfb with the following parameters:');
    console.log('Site:', site);
    console.log('Path:', path);
    console.log('Options:', options);

    // Safely escape the arguments and serialize them into a JSON string
    const JSON_STRING = JSON.stringify({ site, path, options });
    
    // Set DISPLAY for Xvfb (using :99 as the display number)
    process.env.DISPLAY = ':99';
    console.log('DISPLAY is set to:', process.env.DISPLAY);

    // Start Xvfb in the background (without blocking)
    const xvfbProcess = spawn('Xvfb', [':99', '-screen', '0', '1280x1024x24'], {
      stdio: 'ignore', // Don't capture output for Xvfb
      env: process.env
    });

    // Check if Xvfb started successfully
    xvfbProcess.on('error', (error) => {
      console.error('Error starting Xvfb:', error);
      reject(new Error(`Error starting Xvfb: ${error.message}`));
    });

    // Wait a short time to ensure Xvfb has time to start
    setTimeout(() => {
      console.log('Xvfb started, running the node process...');

      // Now run the node script
      const nodeProcess = spawnSync('node', ['./app/helper/screenshot/main.js', JSON_STRING], {
        env: process.env,
        stdio: 'pipe' // Capture stdout and stderr
      });

      // Log any output or errors from the node process
      console.log('stdout:', nodeProcess.stdout.toString());
      console.error('stderr:', nodeProcess.stderr.toString());

      if (nodeProcess.error) {
        console.error('Error running script:', nodeProcess.error);
        reject(new Error(`Error running script: ${nodeProcess.error.message}`));
        return;
      }

      // If the node process was successful, resolve with stdout data
      if (nodeProcess.status !== 0) {
        console.error(`Node process failed with exit code ${nodeProcess.status}`);
        reject(new Error(`Node process failed with exit code ${nodeProcess.status}`));
        return;
      }

      // Resolve with the stdout data
      resolve(nodeProcess.stdout.toString());
      
      // Terminate Xvfb once the script finishes
      xvfbProcess.kill();
    }, 2000); // Wait 2 seconds for Xvfb to start before running the script
  });
};

module.exports = runWithXvfb;