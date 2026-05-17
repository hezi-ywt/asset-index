/**
 * 规则驱动的 frontmatter 校验。
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 读 .asset-index/rules.yaml。不存在返回 {}。
 */
export function loadRules(projectRoot) {
  const rulesPath = path.join(projectRoot, '.asset-index', 'rules.yaml');
  if (!fs.existsSync(rulesPath)) return {};
  try {
    const raw = yaml.load(fs.readFileSync(rulesPath, 'utf-8'));
    return (raw && typeof raw === 'object') ? raw : {};
  } catch {
    return {};
  }
}

function hasField(asset, field) {
  const value = asset.frontmatter[field];
  return value != null && String(value).trim() !== '';
}

function isValidDate(value) {
  if (value == null) return false;
  // Date 对象（yaml 解析日期会变 Date）
  if (value instanceof Date) return !isNaN(value.getTime());
  return DATE_PATTERN.test(String(value));
}

/**
 * 决定一个文件是否算"资产"。
 * - 没配 types：任何有 frontmatter 的 .md 都算
 * - 配了 types：只有 type 在 types 列表里才算
 */
export function isAsset(asset, rules) {
  if (!asset.frontmatter || Object.keys(asset.frontmatter).length === 0) return false;
  const typeRules = rules.types || {};
  if (Object.keys(typeRules).length === 0) return true;
  const assetType = asset.assetType;
  return Boolean(assetType && Object.prototype.hasOwnProperty.call(typeRules, assetType));
}

/**
 * 验证单个资产，返回 issues 数组。
 */
export function checkAsset(asset, rules) {
  const issues = [];

  // --- 默认检查 ---
  if (!asset.frontmatter || Object.keys(asset.frontmatter).length === 0) {
    issues.push({
      severity: 'error',
      code: 'missing_frontmatter',
      message: 'Markdown file has no YAML frontmatter.',
      field: null,
    });
    return issues;
  }

  if (!hasField(asset, 'title') && !hasField(asset, 'name')) {
    issues.push({
      severity: 'error',
      code: 'missing_title',
      message: "Frontmatter is missing 'title' or 'name' field.",
      field: 'title',
    });
  }

  if (!hasField(asset, 'type')) {
    issues.push({
      severity: 'error',
      code: 'missing_type',
      message: "Frontmatter is missing 'type' field.",
      field: 'type',
    });
  }

  if (!hasField(asset, 'status')) {
    issues.push({
      severity: 'error',
      code: 'missing_status',
      message: "Frontmatter is missing 'status' field.",
      field: 'status',
    });
  }

  for (const dateField of ['created', 'modified']) {
    const value = asset.frontmatter[dateField];
    if (value != null && !isValidDate(value)) {
      issues.push({
        severity: 'warning',
        code: 'invalid_date',
        message: `Field '${dateField}' should be in YYYY-MM-DD format.`,
        field: dateField,
      });
    }
  }

  // --- 规则驱动检查 ---
  const requiredFields = rules.required_fields || [];
  for (const field of requiredFields) {
    if (!hasField(asset, field)) {
      issues.push({
        severity: 'error',
        code: 'missing_required_field',
        message: `Required field '${field}' is missing.`,
        field,
      });
    }
  }

  const assetType = asset.assetType;
  const typeRules = rules.types || {};
  if (assetType && Object.keys(typeRules).length > 0) {
    if (Object.prototype.hasOwnProperty.call(typeRules, assetType)) {
      const typeRule = typeRules[assetType] || {};
      for (const field of typeRule.required || []) {
        if (!hasField(asset, field)) {
          issues.push({
            severity: 'error',
            code: 'type_missing_field',
            message: `Type '${assetType}' requires field '${field}'.`,
            field,
          });
        }
      }
    } else if (rules.strict_types) {
      issues.push({
        severity: 'warning',
        code: 'unknown_type',
        message: `Type '${assetType}' is not defined in rules.`,
        field: 'type',
      });
    }
  }

  const allowedStatuses = rules.statuses || [];
  if (allowedStatuses.length > 0 && asset.status && !allowedStatuses.includes(asset.status)) {
    issues.push({
      severity: 'warning',
      code: 'invalid_status',
      message: `Status '${asset.status}' is not in allowed values: ${JSON.stringify(allowedStatuses)}.`,
      field: 'status',
    });
  }

  const dateFields = rules.date_fields || [];
  for (const field of dateFields) {
    const value = asset.frontmatter[field];
    if (value != null && !isValidDate(value)) {
      issues.push({
        severity: 'error',
        code: 'invalid_date_rule',
        message: `Field '${field}' must be in YYYY-MM-DD format.`,
        field,
      });
    } else if (!['created', 'modified'].includes(field) && !hasField(asset, field)) {
      issues.push({
        severity: 'warning',
        code: 'missing_date_field',
        message: `Date field '${field}' is recommended.`,
        field,
      });
    }
  }

  return issues;
}
