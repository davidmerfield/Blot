// Plugin JavaScript for analytics embed code
{{{appJS}}}
{{> flickity-pkgd}}

tocbot.init({
    // Where to render the table of contents.
    tocSelector: '#toc',
    // Where to grab the headings to build the table of contents.
    contentSelector: '.entry',
    // Which headings to grab inside of the contentSelector element.
    headingSelector: 'h1, h2, h3',
    // For headings inside relative or absolute positioned containers within content.
    hasInnerContainers: true,
  });