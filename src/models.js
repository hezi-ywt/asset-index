/**
 * Asset 数据模型——一个 Markdown 文件 + frontmatter + body。
 */

export class Asset {
  constructor({ path, frontmatter = {}, body = '' }) {
    this.path = path;
    this.frontmatter = frontmatter || {};
    this.body = body || '';
  }

  get title() {
    return this.frontmatter.title || this.frontmatter.name || null;
  }

  get assetType() {
    return this.frontmatter.type || null;
  }

  get status() {
    return this.frontmatter.status || null;
  }

  get tags() {
    const tags = this.frontmatter.tags;
    if (!tags) return [];
    if (typeof tags === 'string') {
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return Array.isArray(tags) ? [...tags] : [];
  }

  toDict() {
    return {
      path: this.path,
      frontmatter: this.frontmatter,
      body_preview: this.body.slice(0, 500),
    };
  }

  static fromDict(data) {
    return new Asset({
      path: data.path,
      frontmatter: data.frontmatter || {},
      body: data.body_preview || '',
    });
  }
}
