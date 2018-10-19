// If you add a new property to the template
// make sure it can be read from package.json
// by modifying the properties in ./read.js
module.exports = {
    id: "string",
    name: "string",
    slug: "string",
    owner: "string",
    cloneFrom: "string",
    isPublic: "boolean",
    description: "string",
    localEditing: "boolean",
    thumb: "string",
    locals: "object"
};
