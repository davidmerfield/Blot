const config = require("config");
const generateCdnUrl = require("models/template/util/generateCdnUrl");
const folderManifestUrl = require("../folderManifestUrl");
const { isSafeCdnTarget } = require("../replaceFolderLinks/shared");
const asRetriever = require("../../lib/asRetriever");

module.exports = asRetriever(function (req, res) {
  return function () {
    const manifest = (req && req.template && req.template.cdn) || {};
    const templateID = req.template && req.template.id;

    // Section: {{#cdn}}/path/to/file{{/cdn}}
    const renderCdn = function (text, render) {
      try {
        // Skip CDN URLs for preview subdomains
        if (req.preview) {
          return typeof render === "function" ? render(text) : text;
        }

        let rendered = typeof render === "function" ? render(text) : text;
        if (!rendered || !String(rendered).trim()) return "";

        const renderedNormalized = String(rendered).trim().replace(/^\//, "");

        if (
          templateID &&
          Object.prototype.hasOwnProperty.call(manifest, renderedNormalized)
        ) {
          const entry = manifest[renderedNormalized];

          // A rendered view: the manifest value is its content hash
          if (typeof entry === "string") {
            return generateCdnUrl(renderedNormalized, entry);
          }

          // A file in the blog's folder (see updateCdnManifest)
          const folderFileUrl = folderManifestUrl(req, renderedNormalized);
          if (folderFileUrl) return folderFileUrl;
        }

        // Not in the manifest (e.g. the file doesn't exist). A rooted path
        // stays on the blog's own host, as an absolute URL, rather than
        // becoming a bare /path: that is what {{blog.url}}/path rendered
        // before it was wrapped, and a bare path would resolve against the
        // CDN origin in CSS served from the CDN. View names (style.css) have
        // no leading slash and come back as written, as do targets the
        // manifest builder would reject (whitespace, "..", "//", ...).
        const trimmed = String(rendered).trim();

        if (
          trimmed.charAt(0) === "/" &&
          trimmed.charAt(1) !== "/" &&
          isSafeCdnTarget(trimmed) &&
          req.blog &&
          typeof req.blog.url === "string"
        ) {
          return req.blog.url + trimmed;
        }

        return rendered;
      } catch (e) {
        return text;
      }
    };

    // Interpolation: {{cdn}}
    renderCdn.toString = function () {
      return config.cdn.origin;
    };

    return renderCdn;
  };
});
