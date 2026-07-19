import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageJson = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
);
const cliPath = fileURLToPath(new URL('../bin/asset-index.js', import.meta.url));

test('--version matches package.json', () => {
  const output = execFileSync(process.execPath, [cliPath, '--version'], {
    encoding: 'utf-8',
  });

  assert.equal(output.trim(), packageJson.version);
});
