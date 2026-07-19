import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const sourceRoot = fileURLToPath(new URL('..', import.meta.url));
const packageVersion = JSON.parse(
  fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf-8')
).version;
const preflightPath = path.join(
  sourceRoot,
  'skills',
  'asset-index',
  'scripts',
  'preflight.mjs'
);

test('preflight validates the complete source installation', () => {
  const result = spawnSync(process.execPath, [preflightPath, sourceRoot], {
    cwd: sourceRoot,
    encoding: 'utf-8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Skill: ok/);
  const escapedVersion = packageVersion.replaceAll('.', '\\.');
  assert.match(result.stdout, new RegExp(`CLI: ${escapedVersion} \\(bundled\\)`));
  assert.match(result.stdout, /CLI command:/);
});

test('preflight rejects an incomplete skill installation', t => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-index-preflight-'));
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  const scriptsDir = path.join(tempRoot, 'asset-index', 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  const isolatedPreflight = path.join(scriptsDir, 'preflight.mjs');
  fs.copyFileSync(preflightPath, isolatedPreflight);

  const result = spawnSync(process.execPath, [isolatedPreflight, tempRoot], {
    cwd: tempRoot,
    encoding: 'utf-8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Skill installation is incomplete/);
});

test('preflight rejects a copied skill when no CLI is available', t => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-index-no-cli-'));
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  const skillRoot = path.join(tempRoot, 'asset-index');
  const requiredFiles = [
    'SKILL.md',
    path.join('references', 'schema.md'),
    path.join('references', 'user-notes.md'),
    path.join('scripts', 'preflight.mjs'),
  ];
  for (const relative of requiredFiles) {
    const source = path.join(sourceRoot, 'skills', 'asset-index', relative);
    const target = path.join(skillRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  const isolatedEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'path')
  );
  isolatedEnv.PATH = '';

  const result = spawnSync(
    process.execPath,
    [path.join(skillRoot, 'scripts', 'preflight.mjs'), tempRoot],
    { cwd: tempRoot, encoding: 'utf-8', env: isolatedEnv }
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /No bundled CLI or working global asset-index command/);
});
