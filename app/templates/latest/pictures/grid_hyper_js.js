var articles = [
    {{#archives}}
    {{#months}}
    {{#entries}}
    { 
    	"url": "{{{url}}}",
      "title": "{{title}}",
      "tags": [ {{#tags}}{"tag": "{{tag}}", "slug": "{{slug}}"}, {{/tags}}],
      "thumbnail": "{{{thumbnail.medium.url}}}",
      "date": "{{date}}"
    },
    {{/entries}}
    {{/months}}
    {{/archives}}
  ];

const container = document.getElementById('hyperlist');

const thumbnailSize = {{thumbnail_size}} + (2 * {{spacing_size}});

const itemsPerRow = Math.floor(container.offsetWidth / thumbnailSize);

// Pass the container element and configuration to the HyperList constructor.
// You can optionally use the create method if you prefer to avoid `new`.
const list = HyperList.create(container, {
  // All items must be the exact same height currently. Although since there is
  // a generate method, in the future this should be configurable.
  itemHeight: thumbnailSize,

  height: window.innerHeight - 28,

  // Specify the total amount of items to render the virtual height.
  total: Math.ceil(articles.length / itemsPerRow),

  // Wire up the data to the index. The index is then mapped to a Y position
  // in the container.
  generate(index) {
    const el = document.createElement('div');
    const items = articles.slice(index * itemsPerRow, (index * itemsPerRow) + itemsPerRow);
    let html = '';

    items.forEach(function(item){
    	html += `
      <a href="${item.url}">
          <img src="${item.thumbnail}" class="pre-loaded" onload="this.className+=' loaded';" />
          <noscript>  
          <img src="${item.thumbnail}">
          </noscript>
      </a>
    `
  });

    el.innerHTML = html;
    return el;
  },
});


