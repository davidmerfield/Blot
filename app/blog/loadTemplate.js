const Template = require("models/template");
const Mustache = require("mustache");
const fs = require("fs-extra");
const promisify = require("util").promisify;
const getMetadata = promisify(Template.getMetadata);

module.exports = async function (req, res, next) {
    // We care about template metadata for template
    // locals. Stuff like page-size is set here.
    // Also global colors etc...
    if (!req.blog.template) return next();

    req.log("Loading template", req.blog.template);
    
    let metadata;

    try {
        metadata = await getMetadata(req.blog.template);
    } catch (err) {
        const error = new Error("This template does not exist.");
        error.code = "NO_TEMPLATE";
        return next(error);    
    }

    // If we're in preview mode and there are errors then let's show them
    if (req.preview && metadata.errors && Object.keys(metadata.errors).length > 0) {

        const template = await fs.readFile(__dirname + "/views/template-error.html", "utf-8");

        const errors = Object.keys(metadata.errors).map(view => {
            return { view, error: metadata.errors[view] };
        });

        const html = Mustache.render(template, {
            errors,
            name: metadata.name,
            path: metadata.localEditing ? "Templates/" + metadata.slug + "/" : ""
        });

        return res.status(500).send(html);
    }

    req.template = {
        locals: metadata.locals,
        id: req.blog.template
    };

    req.log("Loaded template", req.blog.template);
    return next();
};