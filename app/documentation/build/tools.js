const fs = require("fs-extra");
const config = require("config");
const yaml = require("yaml");
const cheerio = require("cheerio");
const mustache = require("mustache");

const rootDirectory = config.blot_directory + "/app";
const toolsDirectory = rootDirectory + "/views/how/tools";
const outputDirectory = rootDirectory + "/documentation/data/how/tools";
const html = require("./html");

const renderTemplate = async (name, data, destination) => {
  const template = await fs.readFile(toolsDirectory + "/" + name, "utf8");
  const result = await html(mustache.render(template, data));
  await fs.outputFile(outputDirectory + "/" + (destination || name), result);
};

const fetch = require("node-fetch");

const fetchIcon = async (link, name) => {
  const existingIcon = fs
    .readdirSync(toolsDirectory + "/icons")
    .find(f => f.startsWith(name + "."));

  if (existingIcon) {
    return "/icons/" + existingIcon;
  }

  // load the HTML at the link and determine the icon
  const response = await fetch(link);

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const { hostname, protocol } = new URL(link);

  let icon =
    $("link[rel='apple-touch-icon']").attr("href") ||
    $("link[rel='shortcut icon']").attr("href") ||
    $("link[rel='SHORTCUT ICON']").attr("href") ||
    $("link[rel='icon']").attr("href") ||
    protocol + "//" + hostname + "/favicon.ico";

  // download the icon, convert it to a PNG if it's an ICO
  if (icon.startsWith("//")) icon = "https:" + icon;

  if (icon.startsWith("/")) icon = protocol + "//" + hostname + icon;

  // we already have a data URL
  if (icon.startsWith("data:")) {
    const iconExtension = icon.split(";")[0].split("/")[1];
    const iconPath = toolsDirectory + "/icons/" + name + "." + iconExtension;
    const data = icon.split(",")[1].replace(/%22/g, '"');
    const iconBuffer = Buffer.from(data, "base64");
    //
    await fs.outputFile(iconPath, iconBuffer);

    return "/icons/" + name + "." + iconExtension;
  }

  const iconResponse = await fetch(icon);

  if (!iconResponse.ok) {
    return null;
  }

  const iconBuffer = await iconResponse.buffer();
  const iconExtension = icon.split(".").pop().split("?")[0];
  const iconPath = toolsDirectory + "/icons/" + name + "." + iconExtension;

  await fs.outputFile(iconPath, iconBuffer);

  return "/icons/" + name + "." + iconExtension;
};

const load = async relativePath => {
  try {
    return await fs.readFile(toolsDirectory + "/" + relativePath, "utf8");
  } catch (e) {}
  return "";
};

const main = async () => {
  const categories = (await fs.readdir(toolsDirectory)).filter(
    f => f.indexOf(".") === -1 && f !== "icons"
  );

  const result = { categories: [], tools: [] };

  for (const category of categories) {
    const description = await load(category + "/index.html");
    const $ = cheerio.load(description || "<p></p>");

    const title =
      $("h1").text() ||
      (category[0].toUpperCase() + category.slice(1)).replace(/-/g, " ");

    const tools = (
      await Promise.all(
        (await fs.readdir(toolsDirectory + "/" + category))
          .filter(f => f.indexOf(".") !== 0 && f !== "index.html")
          .map(async tool => await loadTool(category, tool))
      )
    ).sort((a, b) => b.updated - a.updated);

    result.categories.push({ title, description, slug: category, tools });
    result.tools = result.tools.concat(tools);
  }

  // sort categories by the number of tools
  result.categories.sort((a, b) => b.tools.length - a.tools.length);
  result.tools.sort((a, b) => b.updated - a.updated);

  await renderTemplate("index.html", result);

  for (const category of result.categories) {
    await renderTemplate(
      "index.html",
      {
        categories: result.categories.map(c => {
          return { ...c, selected: c.slug === category.slug ? "selected" : "" };
        }),
        tools: category.tools,
        category
      },
      category.slug + "/index.html"
    );
  }

  for (const tool of result.tools) {
    console.log(tool);
    await renderTemplate(
      "tool.html",
      {
        ...tool,
        category: result.categories.find(c => c.slug === tool.category),
        related: result.categories
          .find(c => c.slug === tool.category)
          .tools.filter(t => t.slug !== tool.slug)
      },
      tool.slug + "/index.html"
    );
  }

  return result;
};

const parseYAML = html => {
  if (html.indexOf("---") === -1) return {};
  const parsed = yaml.parse(html.split("---")[1] || "");
  // lowercase all keys from parsed
  const result = {};
  for (const key in parsed) {
    result[key.toLowerCase()] = parsed[key];
  }

  return result;
};

const loadTool = async (category, tool) => {
  const html = await load(category + "/" + tool);
  const updated = new Date(
    (await fs.stat(toolsDirectory + "/" + category + "/" + tool)).mtime
  );

  const metadata = parseYAML(html);

  const $ = cheerio.load(html.replace(/---[\s\S]*?---/, ""));

  // sometimes the HTML file has YAML frontmatter inside '---' fencing

  const slug = tool.replace(".html", "");
  const title =
    $("h1").text() ||
    (slug[0].toUpperCase() + slug.slice(1)).replace(/-/g, " ");

  $("h1").remove();

  const result = {
    title,
    category,
    html: $.html(),
    updated,
    slug,
    ...metadata
  };

  if (result.link) {
    result.icon = await fetchIcon(result.link, result.slug);
  }

  // transform specific properties
  if (result.platforms)
    result.platforms = result.platforms.split(",").map(p => {
      return { name: p.trim() };
    });

  return result;
};

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = main;
