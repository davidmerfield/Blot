1. Install the dependencies needed for this importer:
- Run 'npm install' in the root directory of this repository
- Run 'npm install' in ```app/dashboard/routes/importer```
- Run 'npm install' in ```app/dashboard/routes/importer/sources/squarespace```

2. Fetch [the XML for your blog posts](https://support.squarespace.com/hc/en-us/articles/206566687-Exporting-your-site) from Squarespace.

2. Copy the xml file exported from Squarespace to the Blot/app/dashboard/routes/importer/sources/squarespace folder, renaming it to dump.xml

3. Run the import script from the Blot/app/dashboard/routes/importer/sources/squarespace folder via `node index.js dump.xml output`

4. Your blog posts in markdown are located in Blot/app/dashboard/routes/importer/sources/squarespace/output/