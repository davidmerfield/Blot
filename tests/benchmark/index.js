const path = require('path');
const fs = require('fs-extra');
const { execSync, spawn } = require('child_process');

console.log('BENCHMARK started');

// Check required environment variables
if (!process.env.BLOT_HOST || !process.env.BLOT_PORT) {
    console.error('Error: BLOT_HOST and BLOT_PORT environment variables must be set.');
    process.exit(1);
}

// Ensure wait-for-it.sh is executable
const waitForItPath = './wait-for-it.sh';
if (!fs.existsSync(waitForItPath)) {
    console.error('Error: wait-for-it.sh script not found.');
    process.exit(1);
}
fs.chmodSync(waitForItPath, '755'); // Ensure it's executable

// Wait for the web server to be ready
try {
    console.log('Waiting for the web server to be ready...');
    execSync(`${waitForItPath} ${process.env.BLOT_HOST}:${process.env.BLOT_PORT} -t 120`, { stdio: 'inherit' });
    console.log('Web server is ready');
} catch (error) {
    console.error('Error: Web server did not become ready within the timeout period.');
    process.exit(1);
}

const artilleryPath = path.resolve(__dirname, 'node_modules/.bin/artillery');

// Spawn Artillery to run the benchmark
const artillery = spawn(artilleryPath, ['run', 'artillery.yml'], { stdio: 'inherit' });

// Handle errors when spawning Artillery
artillery.on('error', (error) => {
    console.error(`Failed to start Artillery: ${error.message}`);
    process.exit(1);
});

// Handle Artillery process completion
artillery.on('close', (code) => {
    console.log(`Artillery process exited with code ${code}`);
    console.log('BENCHMARK finished');
    process.exit(code);
});