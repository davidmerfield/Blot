const searchInput = document.getElementById("search-field");
const clickCover = document.getElementById("click-cover");
const searchResults = document.getElementById("search-results");

if (searchInput) {
  let lastResponse = 0;

  clickCover.addEventListener("click", async function () {
    clickCover.style.display = "none";
    searchResults.style.display = "none";
  });

  searchInput.addEventListener("focus", async function () {
    clickCover.style.display = "block";
    searchResults.style.display = "none";
  });

  searchInput.addEventListener("keyup", async function () {
    const requestStart = Date.now();
    const query = searchInput.value;
    const response = await fetch("/search/json?query=" + query);

    if (requestStart < lastResponse) {
      return;
    }

    lastResponse = requestStart;

    const json = await response.json();

    const documentation = json.documentation;
    const questions = json.questions;

    let html = "";

    if (documentation.length === 0 && questions.length === 0) {
      html = "Nothing found";
    } else {
      if (documentation.length) {
        html += documentation
          .map(
            item =>
              `<a href="${item.url}">${item.title}<br><small>${item.url
                .split("/")
                .filter(i => !!i)
                .join(" > ")}</small></a>`
          )
          .join("\n");
      }

      if (questions.length) {
        html +=
          "<p><small>Questions:</small></p>" +
          questions
            .map(item => `<a href="/questions/${item.id}">${item.title}</a>`)
            .join("\n");
      }
      html += `<p><a href="/search?query=${query}">View all</a></p>`;
    }

    clickCover.style.display = "block";
    searchResults.style.display = "block";
    searchResults.innerHTML = html;
  });
}
