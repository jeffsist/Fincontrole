#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting FinControle Frontend (Firebase only)...');

// Start Vite development server
const viteProcess = spawn('npx', ['vite', 'client', '--host', '0.0.0.0', '--port', '5000'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

viteProcess.on('error', (error) => {
  console.error('Error starting Vite:', error);
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  viteProcess.kill('SIGTERM');
});