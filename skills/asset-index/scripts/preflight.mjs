#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PREFIX = '[asset-index preflight]';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const sourceRoot = path.resolve(skillRoot, '..', '..');

function fail(message, remedy) {
  console.error(`${PREFIX} ERROR: ${message}`);
  if (remedy) console.error(`${PREFIX} FIX: ${remedy}`);
  process.exit(1);
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf-8',
    shell: process.platform === 'win32' && command !== process.execPath,
    windowsHide: true,
  });
}

function findProjectRoot(startPath) {
  let current = path.resolve(startPath);
  if (!fs.existsSync(current)) return null;
  if (fs.statSync(current).isFile()) current = path.dirname(current);
  while (true) {
    const rulesPath = path.join(current, '.asset-index', 'rules.yaml');
    if (fs.existsSync(rulesPath) && fs.statSync(rulesPath).isFile()) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
if (!Number.isInteger(nodeMajor) || nodeMajor < 18) {
  fail(`Node.js 18+ is required; found ${process.versions.node}.`, 'Install Node.js 18 or newer.');
}

const requiredSkillFiles = [
  'SKILL.md',
  path.join('references', 'schema.md'),
  path.join('references', 'user-notes.md'),
];
const missingSkillFiles = requiredSkillFiles.filter(
  relative => !fs.existsSync(path.join(skillRoot, relative))
);
if (missingSkillFiles.length > 0) {
  fail(
    `Skill installation is incomplete: ${missingSkillFiles.join(', ')}`,
    'Restore or reinstall the complete skills/asset-index directory.'
  );
}
console.log(`${PREFIX} Skill: ok (${skillRoot})`);
console.log(`${PREFIX} Node.js: ${process.versions.node}`);

const bundledCli = path.join(sourceRoot, 'bin', 'asset-index.js');
const packagePath = path.join(sourceRoot, 'package.json');
if (fs.existsSync(bundledCli)) {
  const result = run(process.execPath, [bundledCli, '--version']);
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || 'unknown error').trim();
    fail(
      `Bundled CLI is present but unusable: ${detail}`,
      `Install its locked dependencies with npm ci --prefix "${sourceRoot}".`
    );
  }
  const version = result.stdout.trim();
  if (fs.existsSync(packagePath)) {
    const expected = JSON.parse(fs.readFileSync(packagePath, 'utf-8')).version;
    if (version !== expected) {
      fail(
        `Bundled CLI reports ${version}, but package.json declares ${expected}.`,
        'Update the CLI implementation and package metadata together.'
      );
    }
  }
  console.log(`${PREFIX} CLI: ${version} (bundled)`);
  console.log(`${PREFIX} CLI command: node "${bundledCli}"`);
} else {
  const result = run('asset-index', ['--version']);
  if (result.status !== 0) {
    fail(
      'No bundled CLI or working global asset-index command was found.',
      'Install asset-index-cli in the agent environment, then rerun this preflight.'
    );
  }
  console.log(`${PREFIX} CLI: ${result.stdout.trim()} (global)`);
  console.log(`${PREFIX} CLI command: asset-index`);
}

const requestedPath = process.argv[2] || process.cwd();
const projectRoot = findProjectRoot(requestedPath);
if (projectRoot) {
  console.log(`${PREFIX} Rules: ${path.join(projectRoot, '.asset-index', 'rules.yaml')}`);
} else {
  console.log(`${PREFIX} Rules: not found (run asset-index init before rule-driven checks)`);
}
