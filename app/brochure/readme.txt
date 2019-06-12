# Brochure site

I found myself much more productive working on the content of the website seperately from it's design. That is, by disabling the CSS file before making any changes to the site itself, I found myself less distracted by the infinite design tweaks that could be made to a given page.

Structure of the site
---------------------

  The entire ./views directory is served as a static folder.
  This was designed to make it convenient to edit the css files.

Adding new content
------------------

  Make sure you update ./routes/sitemap.js with any new and important URLs

Some references
---------------

  UI components:
  https://nhsuk.github.io/nhsuk-frontend/pages/examples.html

  Gray area at bottom of page:
  https://typographica.org/

  Form for commenting:
  https://fontsinuse.com/uses/24278/i-am-third-gale-sayers-with-al-silverman-peng

  Search bar for documentation subpages:
  https://help.micro.blog/2017/whats-next/

  Navigation:
  https://paulrobertlloyd.com/

  Search bar, navigation, layout:
  https://www.muji.net/store/

  Video play buttons:
  https://www.muji.com/jp/about/?area=footer

  Spread for template previews:
  https://www.muji.com/jp/mujilabo/men/index.html

  Full bleed video: 
  https://www.muji.com/jp/wind/
  https://www.muji.com/jp/message/

  Illustrations:
  https://www.muji.com/jp/feature/linen2015ss/

  FAQ typography:
  https://www.notion.so/pricing

  Link styles:
  https://beta.nhs.uk/service-manual/practices/make-your-service-accessible/

  Not sure but I like:
  http://hvflabs.com/contact

  Check marks for updates page:
  https://zeit.co/about

  Code snippet styling:
  https://devcenter.heroku.com/articles/getting-started-with-nodejs#define-a-procfile

  Form labels:
  https://www.ssense.com/en-us/account/login

Demo video script
-----------------

Hello there, I'm going to show you how to use Blot to create a blog. Blot turns a folder into a blog. I've just signed up and connected Blot to this folder using Dropbox. You can use Git too, if you prefer. 

--- text file

Here's my blog, which is empty because my folder is empty. Here's a text file on my desktop. When I put the text file inside my blog's folder, Blot turns it into a blog post automatically and publishes it to my blog. There's the blog post! 

--- image 

Here's an image. Blot knows how to deal with images too. To publish the image to my blog, I just put it inside my folder. This one's straight off my camera – Blot will generate thumbnails and optimized versions of it automatically for you. There it is!

--- word document

Here's a Word Document. It contains a little bit of formatting. Once I stick it into Blot's folder, Blot turns it into a blog post too. If I want to update this blog post, I just update its file. I'll drag this image into the Word Document. And there it is in the post.

--- complicated layout file

This text file contains a little more complicated formatting but Blot knows how to handle it. It's got some interesting layout, embeddded videos, code snippets and more. 

--- folder reorganization

I've got a few posts onto my blog now, and my folder is getting a little messy – you can organize the files inside however you like. Blot doesn't mind, it will keep track of everything.

--- drafts

Let's say you want to preview a post, before publishing it to your live blog. Well, if you create a folder called 'Drafts' and put a file inside, Blot won't publish it. Instead it will create a preview file, which shows you exactly how the post will appear once published. As I make changes to the draft, the preview updates. Once the post is ready, I just move it outside the drafts folder and there it is on my blog. 

--- deleting a post

If I ever want to remove a blog post, and to be honest this is a bit of a weak one, I just remove the file and there, the post is gone.

--- search, RSS, archives

The blog itself that Blot generates comes with the features you'd expect – there's a search engine, an archives page and an RSS feed. 

--- metadata

You'll notice that Blot generates a publish date and permalink for each post automatically – you can override this yourself if you like at the start of the file. There's the new date, and there's the new permalink. You can also add tags to the post.

--- dashboard

Each blog comes with a dashboard to configure your blog's title, theme and domain. Each blog comes with its own subdomain but you can set up Blot on your own domain with a few clicks.  

--- how I use Blot

That's the demo, but now I'll show you how I actually use Blot myself to run a few websites.

--- font archive

I'm learning how to create digital fonts at the moment and documenting the process on a blog. You can see some of my reading notes and fonts-in progress. The fonts in progress are just screenshots in a subfolder. You'll notice this folder has brackets around its name – that's another Blot feature, file inside this folder are tagged 'Work' automatically.

--- personal website

Here's my personal website with links to some of my projects. It's a Word Document with a few links in. I've customized the appearance. You can completely control every aspect of the design of your site. 

--- random color

I also use Blot to the mini sites for some of my other projects too. Behind Blot's template engine is basically a static file server, which is useful for embedding images in blog posts, for example. Anyway, this site is just HTML which Blot serves as-is.

--- conclusion

So that's your introduction to Blot – I charge a small fee to use Blot. Blot's been around for 5 years now and it's independent, profitable and I can confidently say it'll be around for decades. Blot's entire source code is dedicated to the public domain available to you, too. Thank you for taking a look.