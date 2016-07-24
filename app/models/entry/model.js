module.exports =  {
      id: 'number',
      url: 'string',
      permalink: 'string',
      title: 'string',
      titleTag: 'string', // The HTML tag containing the title text
      body: 'string', // html excluding the HTML tag for its title
      summary: 'string', // plain text summary of article
      teaser: 'string', // stuff before <!-- more -->, used before read more linkss..
      teaserBody: 'string', // teaser excluding titleTag
      more: 'boolean', // whether teaser differs from HTML
      html: 'string',
      slug: 'string',
      name: 'string',
      path: 'string',
      size: 'number',
      tags: 'array',
      menu: 'boolean',
      page: 'boolean',
      deleted: 'boolean',
      draft: 'boolean',
      scheduled: 'boolean',
      thumbnail: 'object',

      dateStamp: 'number', // UTC timestamp for resolved date
      created: 'number', // UTC timestamp for when the entry was added to Blot
      updated: 'number', // UTC timestamp for file mtime

      render: 'boolean',
      metadata: 'object',
      retrieve: 'object',
      partials: 'array'
};

// module.exports =  {

//       // body: 'string', // html excluding the HTML tag for its title
//       // teaserBody: 'string', // teaser excluding titleTag
//       // html: 'string',

//       id: 'number',
//       url: 'string',
//       permalink: 'string',

//       // TEXT

//       title: 'string',
//       summary: 'string', // plain text summary of article
//       slug: 'string',

//       // HTML

//       titleTag: 'string', // The HTML tag containing the title text
//       teaser: 'string', // stuff before <!-- more -->, used before read more linkss..
//       remainder: 'string', // stuff after the rest

//       tags: 'array',
//       menu: 'boolean',
//       page: 'boolean',
//       deleted: 'boolean',
//       draft: 'boolean',
//       scheduled: 'boolean',

//       dateStamp: 'number', // UTC timestamp for resolved date
//       created: 'number', // UTC timestamp for when the entry was added to Blot
//       updated: 'number', // UTC timestamp for when entry was modified on Blot

//       render: 'boolean',
//       metadata: 'object',
//       retrieve: 'object',
//       partials: 'array',


//       // FILE INFO

//       name: 'string',
//       path: 'string',
//       size: 'number',
//       mtime: 'number' // UTC timestamp for entry's file's mtime
// };