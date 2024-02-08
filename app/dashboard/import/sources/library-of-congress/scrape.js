// usage
// node scrape.js <LABEL>

// will look inside directory ./data/<LABEL> for a file:
// index-urls.txt

// for each url in the file, it will fetch any item URLs from the index url
// and then concatenate them with the item URLs already defined in the file:
// urls.txt

// with this master list of item URLs, it will then scrape
// the loc item pages and marc records for each item, and then save those to
// the cache directory for the collection

const DATA_DIR = __dirname + "/data";
const fetchItemURLs = require("./fetchItemURLs");
const fetchItem = require("./fetchItem");
const fetchMarcRecord = require("./fetchMarcRecord");

const main = async label => {
  if (!label) {
    console.log("No label provided");
    process.exit(1);
  }

  if (!fs.existsSync(`${DATA_DIR}/${label}`)) {
    console.log(`No data directory found for ${label}`);
    process.exit(1);
  }

  const indexURLFile = `${DATA_DIR}/${label}/index-urls.txt`;
  const itemURLFile = `${DATA_DIR}/${label}/urls.txt`;

  const itemURLs = [];

  const indexURLs = [];

  if (fs.existsSync(itemURLFile)) {
    itemURLs.push(...fs.readFileSync(itemURLFile, "utf-8").split("\n"));
  }

  if (fs.existsSync(indexURLFile)) {
    indexURLs.push(...fs.readFileSync(indexURLFile, "utf-8").split("\n"));
  }

  for (const indexURL of indexURLs) {
    const urls = await fetchItemURLs(indexURL);
    itemURLs.push(...urls);
  }

  const uniqueItems = Array.from(new Set(itemURLs));

  for (const itemURL of uniqueItems) {
    const id = itemURL.match(/\/item\/(\d+)/)[1];
    await fetchItem(id);
    await fetchMarcRecord(id);
  }
};

if (require.main === module) {
  main(process.argv[2]);
}
