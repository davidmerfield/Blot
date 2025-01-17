const fs = require("fs-extra");
const { extname, dirname, join, basename } = require("path");
const titlify = require("build/prepare/titlify");
const ensure = require("helper/ensure");
const LocalPath = require("helper/localPath");
const hash = require("helper/hash");
const sharp = require("sharp");
const config = require("config");
const exifReader = require('exif-reader');
const YAML = require("yaml");

const EXTENSIONS_TO_CONVERT = [".tif", ".tiff", ".webp", ".avif"];
const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ...EXTENSIONS_TO_CONVERT];



function is(path) {
  return SUPPORTED_EXTENSIONS.includes(extname(path).toLowerCase());
}

function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  const localPath = LocalPath(blog.id, path);

  // if we need to convert the image to another format, store the converted image in the asset directory
  const assetDirectory = join(config.blog_static_files_dir, blog.id);
  
  fs.stat(localPath, async (err, stat) => {
    if (err) return callback(err);
    const name = options.name || basename(path);
    const pathForTitle = options.pathDisplay || join(dirname(path), name);
    const title = titlify(pathForTitle);
    const isRetina = path.toLowerCase().includes("@2x") ? 'data-2x="true"' : "";

    let imagePath = path;
    let image = sharp(localPath);

    let metadata = {};
    try {
      const metadataRaw = await image.metadata();
      if (metadataRaw.exif) {
        metadata.exif = exifReader(metadataRaw.exif);
    
        // Define the whitelist of allowed EXIF properties
        const EXIF_PROPERTY_WHITELIST = [
          'Image.Model',
          'Image.Make',
          'Photo.ExposureTime',
          'Photo.FNumber',
          'Photo.DateTimeOriginal',
          'Photo.DateTimeDigitized',
          'Photo.ShutterSpeedValue',
          'Photo.ApertureValue'
        ];
    
        // Recursive function to filter EXIF properties
        const filterExifProperties = (obj, whitelist, parentKey = '') => {
          const result = {};
    
          for (const key in obj) {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
    
            // If the fullKey is in the whitelist, keep the property
            if (whitelist.includes(fullKey)) {
              result[key] = obj[key];
            }
    
            // If the property is an object, recurse into it
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              const filteredChild = filterExifProperties(obj[key], whitelist, fullKey);
              if (Object.keys(filteredChild).length > 0) {
                result[key] = filteredChild; // Only include non-empty objects
              }
            }
          }
    
          return result;
        };
    
        // Filter the EXIF metadata based on the whitelist
        metadata.exif = filterExifProperties(metadata.exif, EXIF_PROPERTY_WHITELIST);
      }
    } catch (error) {
     return callback(error);
    }

    const metadataString = Object.keys(metadata).length === 0 ? "" : `---\n${YAML.stringify(metadata)}---\n\n`;

    if (EXTENSIONS_TO_CONVERT.includes(extname(path).toLowerCase())) {
      const convertedPath = join("/_assets", hash(path), `${name}.png`);
      // ensure asset directory exists
      await fs.ensureDir(join(assetDirectory, "_assets", hash(path)));
      // remove any existing converted image
      await fs.remove(join(assetDirectory, convertedPath));
      try {
      await image.png().toFile(join(assetDirectory, convertedPath));
      imagePath = convertedPath;
      } catch (e) {
      return callback(e);
      }
    }

    const contents = `${metadataString}<img src="${encodeURI(imagePath)}" title="${title}" alt="${title}" ${isRetina}/>`;
    
    callback(null, contents, stat);
  });
}

module.exports = { is, read, id: "img" };
