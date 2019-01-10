# About

{>|} This page describes the design and research invovled for this template, the Photos template. You can start a site with this template right now on [Blot](https://blot.im).

The purpose of this theme is to display photos. Its navigation should get the fuck out of the way when you are looking at photos. It should offer a way to browse photos at different sizes. The [homepage](/) shows a feed a of recently published photos. The [archives](/archives) give an overview of all the photos published on this site.

{>|} [Download a copy of the folder](/folder.zip) (22mb) from which this site is generated. [View the source for this template](). Blot's source code, including this template, is dedicated to the public domain. 

The images on this site are courtesy of the [IEMS](http://iems-ferox.com). Many thanks to the brave souls on the [Ferox expedition](http://iems-ferox.com) for their kind contributions to the public domain.

Gavin Atkinson's [compilation of image user interfaces](https://www.are.na/gavin-atkinson-1489764520/image-ui) has been useful to discover some interesting techniques to navigate and index images in a browser.

{>|} Line me up, bitch.


- The 'Close' button which dumps you back into the previous index page is rather useful. 
- The fade-on-load feature for the grid of images is rather nice. It's a pretty simple technique and I'm going to use it again here.

{>|} Interested to see how the layout for this page was marked up? [View the source file for this page](?source=true)




***

I've been trying hard to focus on getting the details right. Here are a few things which I have done to this template which might not meet the eye:

- The pagination on the index page uses your system typeface's tabular numbers feature, where possible. This prevents the width of the page indicator changing.

- The years in the footer indicate the range of published works. It sometimes looks a little silly if you have only published stuff this year, but oh well!

- The thumbnail's computed width and height to block out the layout quickly so nothing has to be recalculated as each image makes its way down the tubes.

- Thumbnails are never cropped. They are always displayed in the aspect ratio chosen by the photographer. To do otherwise seemes rude. Of course, this complicates the layout but that is my job.

{<>} I'm going to borrow a few of the features of the archive's template[^footnote]

Typographically, I have tried to keep things as quiet as possible. When designing a theme, it's easy to get lost in the ornamentation of the theme's *chrome*, its menu bar, its search field. It's colors. I like the menu and page typography of [Georgia Kareola's website](https://notapipe.today)

{>|} ![Image](/_image_cache/560717cb-4ad7-4fb3-923d-09ad705eb282.jpg)

{>|} BITCH I'm flowing straight from the survival scrolls

Things to do:

*Bind arrow keys to next / previous links.*
*Add support for layout.css.*
*Add support for typeset.css*

I want intra photo navigation with arrows

For the archives page, I like this hover effect:

http://www.hofstede.com.au/

SHow the thumbnail in one place...

I like the [ + ] to show the menu: http://dariusou.work/popgun-presents-posters.html

I like the radio button filters for the archives page:

http://spectorbooks.com/under-the-radar


[^footnote]: Test, [Link](https://google.com).:
