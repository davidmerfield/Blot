const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const NETDATA_CONFIG = require('./config');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .reduce((vars, line) => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          vars[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
        return vars;
      }, {});

    Object.assign(process.env, envVars);
  } catch (error) {
    console.error('Error reading .env file:', error);
    process.exit(1);
  }
}

function validateEnv() {
  const required = ['NETDATA_PORT', 'NETDATA_USER', 'NETDATA_PASSWORD'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

async function deployNetdata() {
  try {
    loadEnvFile();
    validateEnv();

    const setupCommands = `
      mkdir -p ~/netdataconfig/netdata
      # Write Netdata config
      cat > ~/netdataconfig/netdata/netdata.conf << 'EOL'
${NETDATA_CONFIG}
EOL
      # Create password file
      htpasswd -cb ~/netdataconfig/netdata/passwords "${process.env.NETDATA_USER}" "${process.env.NETDATA_PASSWORD}"`;

    await executeCommand(`ssh blot "${setupCommands}"`);

    const dockerCommand = `docker run -d --name=netdata \
  --pid=host \
  -p ${process.env.NETDATA_PORT}:19999 \
  --memory="256m" \
  --memory-swap="256m" \
  --cpus="0.5" \
  -e VIRTUAL_HOST=stats.blot.im \
  -v \${HOME}/netdataconfig/netdata:/etc/netdata \
  -v netdatalib:/var/lib/netdata \
  -v netdatacache:/var/cache/netdata \
  -v /:/host/root:ro,rslave \
  -v /etc/passwd:/host/etc/passwd:ro \
  -v /etc/group:/host/etc/group:ro \
  -v /etc/localtime:/etc/localtime:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /etc/os-release:/host/etc/os-release:ro \
  -v /var/log:/host/var/log:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --restart unless-stopped \
  --cap-add SYS_PTRACE \
  --cap-add SYS_ADMIN \
  --security-opt apparmor=unconfined \
  netdata/netdata`;

    // Only remove the container, keep the volumes
    await executeCommand(`ssh blot "docker rm -f netdata || true"`);
    await executeCommand(`ssh blot "${dockerCommand}"`);

    console.log(`Netdata deployment completed successfully`);
    console.log(`Available at https://stats.blot.im`);
    console.log(`Username: ${process.env.NETDATA_USER}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Command output:', stdout);
        console.error('Command errors:', stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

deployNetdata();