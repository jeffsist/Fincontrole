#!/usr/bin/env node

// Simple script to start only the frontend with Vite
import { spawn } from 'child_process';

const viteProcess = spawn('npx', ['vite', 'client', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
});

process.on('SIGINT', () => {
  viteProcess.kill('SIGINT');
});