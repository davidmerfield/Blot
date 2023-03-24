let cachedIndex;
let metadata;

async function loadIndex() {
  if (cachedIndex) return cachedIndex;

  const response = await fetch("/search.json");
  const json = await response.json();

  // map containing article titles
  metadata = { ...json.metadata };
  delete json.metadata;

  cachedIndex = elasticlunr.Index.load(json);
  return cachedIndex;
}

const searchInput = document.getElementById("search-field");
const clickCover = document.getElementById("click-cover");
const searchResults = document.getElementById("search-results");

if (searchInput) {


clickCover.addEventListener("click", async function () {
  clickCover.style.display = "none";
  searchResults.style.display = "none";
});

searchInput.addEventListener("focus", async function () {
  clickCover.style.display = "block";
  searchResults.style.display = "none";
});

searchInput.addEventListener("keyup", async function () {
  const index = await loadIndex();
  const results = index
    .search(searchInput.value)
    .slice(0, 5)
    .filter((item) => {
      const ref = item.ref;
      return metadata[ref] && metadata[ref].title;
    });
  if (results.length === 0) {
    return (searchResults.style.display = "none");
  }
  clickCover.style.display = "block";
  searchResults.style.display = "block";
  searchResults.innerHTML = results
    .map(
      (item) =>
        `<a href="/${item.ref}">${metadata[item.ref].title}<br><small>${item.ref}</small></a>`
    )
    .join("\n");
});

}
