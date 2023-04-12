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
    const response = await fetch("/search?query=" + searchInput.value);
    const results = await response.json();
    if (results.length === 0) {
      return (searchResults.style.display = "none");
    }
    clickCover.style.display = "block";
    searchResults.style.display = "block";
    searchResults.innerHTML = results
      .map(
        (item) =>
          `<a href="${item.url}">${item.title}<br><small>${item.url}</small></a>`
      )
      .join("\n");
  });
}
