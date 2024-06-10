var config = require("config");
var Template = require("models/template");
var makeSlug = require("helper/makeSlug");

// should return a template owned by the blog, if it exists,
// or a template owned by the site if it exists or null if neither exist
const loadTemplate = async (blogID, templateSlug) => {

  let template;

  template = await getMetadata(Template.makeID(blogID, makeSlug(templateSlug)));

  if (template) return template;

  template = await getMetadata(Template.makeID("SITE", makeSlug(templateSlug)));

  if (template) return template;

  return null;
};

const getMetadata = (templateID) => {
  return new Promise((resolve, reject) => {
    Template.getMetadata(templateID, (err, template) => {
      if (err || !template) return resolve(null);
      resolve(template);
    });
  });
};

module.exports = async function (req, res, next) {
    
  try {

    const template = await loadTemplate(req.blog.id, req.params.templateSlug);
    
    if (!template.slug) template.slug = req.params.templateSlug;

    if (!template.name) template.name = template.slug[0].toUpperCase() + template.slug.slice(1).replace(/-/g, " ");

    if (!template.id) template.id = Template.makeID(req.blog.id, template.slug);

    template.checked = template.id === req.blog.template ? "checked" : "";

    req.template = res.locals.template = template;

    res.locals.base = `${req.protocol}://${req.hostname}${req.baseUrl}/${req.params.templateSlug}`;
    // used to filter messages sent from the iframe which contains a preview of the
    // template in the template editor, such that we only save the pages which are
    // part of the template.
    res.locals.previewOrigin = `https://preview-of${template.owner === req.blog.id ? '-my' : ''}-${template.slug}-on-${req.blog.handle}.${config.host}`;
    // we persist the path of the page of the template
    // last viewed by the user in the database

    res.locals.preview =
      res.locals.previewOrigin + (req.template.previewPath || "");

      res.locals.breadcrumbs.add(req.template.name, req.template.slug);

    next();
  } catch (err) {
    next(err);
  }
};