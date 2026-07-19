/**
 * CLI entry point — 6 commands: init / scan / search / list / check / stats
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import {
  scanDirectory,
  getProjectRoot,
  loadIndex,
  saveIndex,
  parseFrontmatter,
} from './store.js';
import { loadRules, isAsset, checkAsset } from './checker.js';
import { Asset } from './models.js';

const { version: VERSION } = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
);

const SAMPLE_RULES = `# Asset index validation rules for this project.
# Customize these rules to match your project's frontmatter conventions.

# Directories to skip during scan (relative path prefixes or glob patterns)
exclude_paths:
  - .opencode/
  - .asset-index/
  - node_modules/

# Fields that must exist in every asset's frontmatter
required_fields:
  - title
  - type
  - status
  - created
  - modified

# Allowed asset types and their type-specific requirements
types:
  角色:
    required: [name]
  场景:
    required: [name]
  道具:
    required: [name]
  剧本:
    required: [episode]
  分镜:
    required: [episode]
  原始故事:
    required: [chapter]
  故事小说:
    required: []
  游戏设计:
    required: []

# Allowed status values
statuses:
  - 草稿
  - 进行中
  - 完成
  - 已整理
  - 已迁移
  - archived

# Fields that must be valid YYYY-MM-DD dates
date_fields:
  - created
  - modified

# Set to true to warn on unknown types
strict_types: false
`;

function filterAssets(assets, rules) {
  return assets.filter(asset => isAsset(asset, rules));
}

function loadExcludePaths(projectRoot) {
  const rules = loadRules(projectRoot);
  return rules.exclude_paths || [];
}

async function getAssets(p) {
  const target = path.resolve(p);
  const projectRoot = getProjectRoot(target) || target;
  const cachePath = path.join(projectRoot, '.asset-index', 'cache.json');
  let assets = loadIndex(cachePath);
  if (assets === null) {
    const excludes = loadExcludePaths(projectRoot);
    assets = await scanDirectory(target, { excludePaths: excludes });
    saveIndex(cachePath, assets);
  }
  return assets;
}

async function getIndexedAssets(p) {
  const target = path.resolve(p);
  const projectRoot = getProjectRoot(target) || target;
  const rules = loadRules(projectRoot);
  return filterAssets(await getAssets(p), rules);
}

export function run() {
  const program = new Command();

  program
    .name('asset-index')
    .description('Atomic CLI for frontmatter-based asset index management.')
    .version(VERSION);

  // init
  program
    .command('init')
    .description('Initialize .asset-index/ directory with sample rules.yaml.')
    .argument('[path]', 'Target path', '.')
    .option('--force', 'Overwrite existing config', false)
    .action((p, opts) => {
      const target = path.resolve(p);
      const assetIndexDir = path.join(target, '.asset-index');
      const rulesFile = path.join(assetIndexDir, 'rules.yaml');
      if (fs.existsSync(assetIndexDir) && !opts.force) {
        console.log(`[asset-index] Config already exists (${assetIndexDir}).`);
        console.log('Run with --force to overwrite.');
        return;
      }
      fs.mkdirSync(assetIndexDir, { recursive: true });
      fs.writeFileSync(rulesFile, SAMPLE_RULES, 'utf-8');
      console.log(`[asset-index] Initialized ${assetIndexDir}`);
      console.log(`[asset-index] Created sample rules: ${rulesFile}`);
    });

  // scan
  program
    .command('scan')
    .description('Scan directory for .md files and build index cache.')
    .argument('[path]', 'Target path', '.')
    .action(async (p) => {
      const target = path.resolve(p);
      const projectRoot = getProjectRoot(target) || target;
      const cachePath = path.join(projectRoot, '.asset-index', 'cache.json');
      const rules = loadRules(projectRoot);
      const excludes = loadExcludePaths(projectRoot);

      const assets = await scanDirectory(target, { excludePaths: excludes });
      const withFm = assets.filter(a => Object.keys(a.frontmatter).length > 0);
      const indexed = filterAssets(assets, rules);
      const withoutFm = assets.length - withFm.length;

      saveIndex(cachePath, assets);
      console.log(`Scanned ${assets.length} files, found ${indexed.length} indexed assets.`);
      console.log(`  (${withFm.length} files with frontmatter)`);
      if (withoutFm > 0) console.log(`  (${withoutFm} files without frontmatter)`);
    });

  // search
  program
    .command('search')
    .description('Search indexed assets by keyword or filters.')
    .argument('[query]', 'Search query', '')
    .option('--type <type>', 'Filter by asset type')
    .option('--status <status>', 'Filter by status')
    .option('--tag <tag>', 'Filter by tag')
    .option('--path <path>', 'Project path to search', '.')
    .option('--format <format>', 'Output format (text|json)', 'text')
    .action(async (query, opts) => {
      const assets = await getIndexedAssets(opts.path);
      const results = [];
      const queryLower = (query || '').toLowerCase();
      for (const asset of assets) {
        if (opts.type && asset.assetType !== opts.type) continue;
        if (opts.status && asset.status !== opts.status) continue;
        if (opts.tag && !asset.tags.includes(opts.tag)) continue;
        if (query) {
          const searchable = [
            asset.title || '',
            asset.assetType || '',
            asset.status || '',
            asset.tags.join(' '),
            asset.body,
          ].join(' ').toLowerCase();
          if (!searchable.includes(queryLower)) continue;
        }
        results.push(asset);
      }
      if (opts.format === 'json') {
        console.log(JSON.stringify(results.map(a => a.toDict()), null, 2));
      } else {
        for (const asset of results) {
          const title = asset.title || path.basename(asset.path);
          console.log(`  ${title} | ${asset.assetType || 'no-type'} | ${asset.path}`);
        }
      }
    });

  // list
  program
    .command('list')
    .description('List all indexed assets.')
    .option('--type <type>', 'Filter by asset type')
    .option('--status <status>', 'Filter by status')
    .option('--path <path>', 'Project path to list', '.')
    .option('--format <format>', 'Output format (text|json)', 'text')
    .action(async (opts) => {
      let results = await getIndexedAssets(opts.path);
      if (opts.type) results = results.filter(a => a.assetType === opts.type);
      if (opts.status) results = results.filter(a => a.status === opts.status);
      if (opts.format === 'json') {
        console.log(JSON.stringify(results.map(a => a.toDict()), null, 2));
      } else {
        console.log(`Assets (${results.length}):`);
        for (const asset of results) {
          const title = asset.title || path.basename(asset.path);
          const tags = asset.tags.length ? asset.tags.join(', ') : '-';
          console.log(
            `  ${title} | type=${asset.assetType || '?'} | status=${asset.status || '?'} | tags=[${tags}] | ${asset.path}`
          );
        }
      }
    });

  // check
  program
    .command('check')
    .description('Validate assets against rules.')
    .option('--file <file>', 'Check a single file')
    .option('--path <path>', 'Project path to check', '.')
    .option('--format <format>', 'Output format (text|json)', 'text')
    .action(async (opts) => {
      const target = path.resolve(opts.path);
      const projectRoot = getProjectRoot(target) || target;
      const rules = loadRules(projectRoot);
      let assets;
      if (opts.file) {
        const asset = new Asset({ path: opts.file, frontmatter: {}, body: '' });
        try {
          const text = fs.readFileSync(opts.file, 'utf-8');
          const { frontmatter, body } = parseFrontmatter(text);
          asset.frontmatter = frontmatter;
          asset.body = body;
        } catch {
          console.error(`[asset-index] Cannot read file: ${opts.file}`);
          process.exit(1);
        }
        assets = [asset];
      } else {
        assets = await getIndexedAssets(opts.path);
      }
      const allIssues = [];
      let hasErrors = false;
      for (const asset of assets) {
        for (const issue of checkAsset(asset, rules)) {
          allIssues.push({ path: asset.path, ...issue });
          if (issue.severity === 'error') hasErrors = true;
        }
      }
      if (opts.format === 'json') {
        console.log(JSON.stringify(allIssues, null, 2));
      } else if (allIssues.length === 0) {
        console.log('All assets passed validation.');
      } else {
        for (const issue of allIssues) {
          const sev = issue.severity.toUpperCase();
          console.log(`[${sev}] ${issue.path}: ${issue.message}`);
        }
      }
      if (hasErrors) process.exit(1);
    });

  // stats
  program
    .command('stats')
    .description('Show asset statistics.')
    .option('--path <path>', 'Project path to analyze', '.')
    .option('--format <format>', 'Output format (text|json)', 'text')
    .action(async (opts) => {
      const assets = await getAssets(opts.path);
      const indexed = await getIndexedAssets(opts.path);
      const withFm = assets.filter(a => Object.keys(a.frontmatter).length > 0);
      const withoutFm = assets.length - withFm.length;
      const typeCounts = {};
      const statusCounts = {};
      const tagCounts = {};
      for (const asset of indexed) {
        const t = asset.assetType || '(no type)';
        typeCounts[t] = (typeCounts[t] || 0) + 1;
        const s = asset.status || '(no status)';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
        for (const tag of asset.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
      const data = {
        total_files: assets.length,
        with_frontmatter: withFm.length,
        indexed_assets: indexed.length,
        without_frontmatter: withoutFm,
        type_distribution: typeCounts,
        status_distribution: statusCounts,
        top_tags: Object.fromEntries(
          Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
        ),
      };
      if (opts.format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(`Total files scanned: ${assets.length}`);
        console.log(`  With frontmatter: ${withFm.length}`);
        console.log(`  Indexed assets: ${indexed.length}`);
        console.log(`  Without frontmatter: ${withoutFm}`);
        console.log();
        console.log('Type distribution:');
        Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
          console.log(`  ${t}: ${c}`);
        });
        console.log();
        console.log('Status distribution:');
        Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
          console.log(`  ${s}: ${c}`);
        });
        if (Object.keys(tagCounts).length > 0) {
          console.log();
          console.log('Top tags:');
          Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([t, c]) => {
            console.log(`  ${t}: ${c}`);
          });
        }
      }
    });

  // 没传子命令时显示帮助
  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(1);
  }

  program.parse();
}
