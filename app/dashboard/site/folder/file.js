const debug = require("debug")("blot:dashboard:folder:kind");
const basename = require("path").basename;
const extname = require("path").extname;
const Metadata = require("models/metadata");
const Entry = require("models/entry");
const IgnoredFiles = require("models/ignoredFiles");
const moment = require("moment");
const converters = require("build/converters");

require("moment-timezone");

module.exports = async function (blog, path) {
  return new Promise((resolve, reject) => {
    const blogID = blog.id;

    Promise.all([
      new Promise((resolve, reject) => {
        Metadata.get(blogID, path, function (err, casePresevedName) {
          if (err) return reject(err);
          resolve(casePresevedName);
        });
      }),
      new Promise((resolve, reject) => {
        IgnoredFiles.getStatus(blogID, path, function (err, ignored) {
          if (err) return reject(err);
          resolve(ignored);
        });
      }),
      new Promise((resolve, reject) => {
        Entry.get(blogID, path, function (entry) {
          resolve(entry);
        });
      }),
    ])
      .then(([casePresevedName, ignoredReason, entry]) => {
        
        let ignored = {};

        if (!entry) {

          if (ignoredReason && ignoredReason === 'WRONG_TYPE') {
            ignored.wrongType = true;
          } else if (path.toLowerCase().indexOf("/templates/") === 0) {
            ignored.templateFile = true;
          } else if (
            path.split("/").slice(0,-1).filter(function (n) {
              return n[0] === "_";
            }).length) {
            ignored.underscorePath = true;
          } else if (basename(path)[0] === "_") {
            ignored.underscoreName = true;
          } else if (ignoredReason && ignoredReason === 'TOO_LARGE') {
            ignored.tooLarge = true;
          } else  {
            ignored.syncing = true;
          }
        }

        const file = {};

        file.kind = kind(path);
        file.path = path;
        file.url = encodeURIComponent(path.slice(1));
        file.name = casePresevedName || basename(path);

        // a dictionary we use to display conditionally in the UI
        file.extension = {};
        file.extension = normalizeExtension(path)
        
        file.entry = entry;
        file.ignored = ignored;

        if (entry) {
          // Replace with case-preserving
          entry.name = file.name;

          entry.converter = {};
          entry.converter[converters.find((converter) => {
            return converter.is(path);
          }).id] = true;
          
          entry.type = entry.draft ? 'draft' : entry.page ? 'page' :  'post';
          entry.Type = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
          
          entry.tags = entry.tags.map((tag, i, arr) => {
            return { tag, first: i === 0, last: i === arr.length - 1 };
          });

          entry.date = moment
            .utc(entry.dateStamp)
            .tz(blog.timeZone)
            .format("MMMM Do YYYY, h:mma");

          if (
            entry.page &&
            entry.menu === false &&
            [".txt", ".md", ".html"].indexOf(extname(entry.path)) === -1
          ) {
            entry.url = entry.path;
          }

          if (entry.draft) {
            entry.url = "/draft/view" + entry.path;
          }

          entry.backlinks = entry.backlinks.map((backlink) => {
            return  { backlink};
          });

          entry.dependencies = entry.dependencies.map((dependency) => {
            return { dependency };
           });

           entry.internalLinks = entry.internalLinks.map((internalLink) => {
            return { internalLink };
          });

          entry.metadata = Object.keys(entry.metadata).map((key) => {
            return { key, value: entry.metadata[key] };
          });

          if (entry.scheduled) {
            entry.url += "?scheduled=true";
            entry.toNow = moment.utc(entry.dateStamp).fromNow();
          }
        }
        
        resolve(file);
      })
      .catch((err) => {
        reject(err);
      });
  });
};



// https://fileinfo.com/filetypes/common

const KIND = {
  txt: "Plain text document",
  jpg: "JPG image",
  jpeg: "JPEG image",
  odt: "OpenDocument Text document",
  rtf: "Rich Text File",
  doc: "Microsoft Word document",
  docx: "Microsoft Word document",
  ai: "Adobe Illustrator document",
  js: "JavaScript file",
  css: "Cascading Style Sheet",
  html: "HTML document",
};

const CATEGORIES = {
  "image": ["jpg", "jpeg", "png", "gif", "bmp", "tiff"],
  "audio": ["mp3", "wav", "wma", "ogg", "flac", "aac"],
  "video": ["mp4", "avi", "mkv", "mov", "flv", "wmv"],
};

function kind (path) {
  let kind = "File";
  let extension;

  extension = extname(path).toLowerCase().slice(1);
  kind = KIND[extension] || extension.toUpperCase();
  debug(path, extension, kind);

  return kind;
}


// should return a lowercase, trimmed extension
// with common equivalents normalized e,g. jpeg -> jpg
function normalizeExtension (path) {
  let extension = extname(path).toLowerCase().slice(1);

  if (extension === "jpeg") {
    extension = "jpg";
  } 

  let res = {category: {}};

  res.category[Object.keys(CATEGORIES).find((category) => {
    return CATEGORIES[category].indexOf(extension) > -1;
  })] = true;

  res[extension] = true;

  return res;
}