/**
 * 扫描、缓存、持久化层。
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import fg from 'fast-glob';
import { Asset } from './models.js';

/**
 * 解析 markdown 文本里的 frontmatter。
 * 用 YAML CORE_SCHEMA（YAML 1.2 core）—— 不会把 "2026-05-17" 这种 ISO 日期
 * 自动解析成 Date 对象，保留为字符串，跟 Python 版本行为一致。
 * @returns {{frontmatter: object, body: string}}
 */
export function parseFrontmatter(text) {
  if (!text || !text.startsWith('---')) {
    return { frontmatter: {}, body: text || '' };
  }
  try {
    const result = matter(text, {
      engines: {
        yaml: (str) => yaml.load(str, { schema: yaml.CORE_SCHEMA }),
      },
    });
    const fm = result.data && typeof result.data === 'object' ? result.data : {};
    return {
      frontmatter: fm,
      body: (result.content || '').replace(/^\n+|\n+$/g, ''),
    };
  } catch {
    return { frontmatter: {}, body: text };
  }
}

/**
 * 把相对路径跟 exclude 模式匹配（前缀 or glob）。
 */
function isExcluded(filePath, root, excludePaths) {
  const rel = path.relative(root, filePath).split(path.sep).join('/');
  for (let pattern of excludePaths) {
    if (pattern.startsWith('./')) pattern = pattern.slice(2);
    if (pattern.includes('*')) {
      // 简单 glob 转 regex
      const regexStr = '^' + pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*') + '$';
      if (new RegExp(regexStr).test(rel)) return true;
    } else {
      const cleaned = pattern.replace(/\/$/, '');
      if (rel === cleaned || rel.startsWith(cleaned + '/')) return true;
    }
  }
  return false;
}

/**
 * 扫描目录下所有 .md 文件，返回 Asset 数组。
 */
export async function scanDirectory(rootPath, { excludePaths = [] } = {}) {
  const root = path.resolve(rootPath);
  const mdFiles = await fg('**/*.md', {
    cwd: root,
    absolute: true,
    onlyFiles: true,
    dot: false,
    followSymbolicLinks: false,
  });

  const assets = [];
  for (const mdPath of mdFiles) {
    if (excludePaths.length && isExcluded(mdPath, root, excludePaths)) continue;
    let text;
    try {
      text = fs.readFileSync(mdPath, 'utf-8');
    } catch {
      continue;
    }
    const { frontmatter, body } = parseFrontmatter(text);
    assets.push(new Asset({ path: mdPath, frontmatter, body }));
  }
  return assets;
}

/**
 * 从 startPath 向上找含 .asset-index/ 的目录。
 */
export function getProjectRoot(startPath) {
  let current = path.resolve(startPath);
  if (fs.existsSync(current) && fs.statSync(current).isFile()) {
    current = path.dirname(current);
  }
  while (true) {
    const dir = path.join(current, '.asset-index');
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/**
 * 读 cache。不存在或损坏返回 null。
 */
export function loadIndex(cachePath) {
  const resolved = path.resolve(cachePath);
  if (!fs.existsSync(resolved)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
    return (data.assets || []).map(item => Asset.fromDict(item));
  } catch {
    return null;
  }
}

/**
 * 写 cache。
 */
export function saveIndex(cachePath, assets) {
  const resolved = path.resolve(cachePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(
    resolved,
    JSON.stringify({ assets: assets.map(a => a.toDict()) }, null, 2),
    'utf-8'
  );
}
