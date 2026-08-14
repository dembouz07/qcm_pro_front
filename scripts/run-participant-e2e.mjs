import { spawn } from 'node:child_process';
import process from 'node:process';

const host = '127.0.0.1';
const port = '4177';
const baseUrl = `http://${host}:${port}`;
const runtimeEnv = { ...process.env, VITE_API_URL: '/api' };
let viteProcess = null;
let viteOutput = '';

function run(command, args, options = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env: runtimeEnv,
    windowsHide: true,
    ...options,
  });
}
async function isReady() {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await isReady()) return;
    if (viteProcess?.exitCode != null) {
      throw new Error(`Vite s’est arrêté avant d’être prêt.\n${viteOutput}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Vite n’a pas répondu sur ${baseUrl}.\n${viteOutput}`);
}

async function stopVite() {
  if (!viteProcess || viteProcess.exitCode != null) return;
  const exited = new Promise((resolve) => viteProcess.once('exit', resolve));
  viteProcess.kill('SIGTERM');
  await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (viteProcess.exitCode == null) viteProcess.kill('SIGKILL');
}

async function main() {
  if (!(await isReady())) {
    viteProcess = run(process.execPath, [
      'node_modules/vite/bin/vite.js',
      '--host', host,
      '--port', port,
      '--strictPort',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    viteProcess.stdout.on('data', (chunk) => { viteOutput += chunk.toString(); });
    viteProcess.stderr.on('data', (chunk) => { viteOutput += chunk.toString(); });
    await waitForServer();
  }

  const playwright = run(process.execPath, [
    'node_modules/@playwright/test/cli.js',
    'test',
    ...process.argv.slice(2),
  ], { stdio: 'inherit' });
  const exitCode = await new Promise((resolve) => playwright.once('exit', resolve));
  if (exitCode !== 0) process.exitCode = exitCode ?? 1;
}

try {
  await main();
} finally {
  await stopVite();
}
