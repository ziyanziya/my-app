const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [];

function run(args) {
  // Expo suppresses the interactive QR code whenever CI=true is inherited
  // from a terminal or IDE. Development runs must stay interactive.
  const childEnv = { ...process.env };
  delete childEnv.CI;
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: childEnv,
  });
  processes.push(child);
  child.on('exit', (code) => {
    if (code && !shuttingDown) process.exitCode = code;
  });
  return child;
}

let shuttingDown = false;
function stop() {
  if (shuttingDown) return;
  shuttingDown = true;
  processes.forEach((child) => child.kill());
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

// The app's authentication endpoints are local during development. Starting
// both processes together prevents the client from pointing at a stale LAN IP.
run(['run', 'start:server']);
run(['run', 'start:app', '--', ...process.argv.slice(2)]);
