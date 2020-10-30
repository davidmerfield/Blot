
  var articles = [
    {{#archives}}
    {{#months}}
    {{#entries}}
    { 
      "title": "{{title}}",
      "tags": [ {{#tags}}{"tag": "{{tag}}", "slug": "{{slug}}"}, {{/tags}}],
      "thumbnail": "{{{thumbnail.small.url}}}",
      "date": "{{date}}"
    },
    {{/entries}}
    {{/months}}
    {{/archives}}
  ];

const container = document.getElementById('hyperlist');

// Pass the container element and configuration to the HyperList constructor.
// You can optionally use the create method if you prefer to avoid `new`.
const list = HyperList.create(container, {
  // All items must be the exact same height currently. Although since there is
  // a generate method, in the future this should be configurable.
  itemHeight: 30,

    height: window.innerHeight - 28,

  // Specify the total amount of items to render the virtual height.
  total: articles.length,

  // Wire up the data to the index. The index is then mapped to a Y position
  // in the container.
  generate(index) {
    const el = document.createElement('tr');
    el.innerHTML = `
      <td class="thumbnail">
          <img src="${articles[index].thumbnail}" class="pre-loaded" onload="this.className+=' loaded';" />
          <noscript>  
          <img src="${articles[index].thumbnail}">
          </noscript>
      </td>
      <td class="title">${articles[index].title}</td>
      <td>${articles[index].date}</td>
      <td>${articles[index].tags}</td>
    `;
    return el;
  },
});


