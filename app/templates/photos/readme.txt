# About

{>|} This page describes the design and research invovled for this template, the Photos template. You can start a site with this template right now on [Blot](https://blot.im).

The purpose of this theme is to display photos. Its navigation should get out of the way when you are looking at photos. It should offer a way to browse photos at different sizes. The [homepage](/) shows a feed a of recently published photos. The [archives](/archives) give an overview of all the photos published on this site.

{>|} [Download a copy of the folder](/folder.zip) (22mb) from which this site is generated. [View the source for this template](). Blot's source code, including this template, is dedicated to the public domain. 

The images on this site are courtesy of the [IEMS](http://iems-ferox.com). Many thanks to the brave souls on the [Ferox expedition](http://iems-ferox.com) for their kind contributions to the public domain.

Gavin Atkinson's [compilation of image user interfaces](https://www.are.na/gavin-atkinson-1489764520/image-ui) has been useful to discover some interesting techniques to navigate and index images in a browser.

For the archives page, I like this hover effect:

I like the radio button filters for the archives page: http://www.hofstede.com.au/

{>|} Line me up, bitch.


- The 'Close' button which dumps you back into the previous index page is rather useful. 
- The fade-on-load feature for the grid of images is rather nice. It's a pretty simple technique and I'm going to use it here.

{>|} [View the source file for this page](?source=true) to see how the layout for this page was marked up.



***

I have tried to keep things as quiet as possible. When designing a theme, it's easy to get lost in the ornamentation of the theme's *chrome*, its menu bar, its search field. It's colors. I like the menu and page typography of [Georgia Kareola's website](https://notapipe.today)

I've been trying hard to focus on getting the details right. Here are a few things which I have done to this template which might not meet the eye:

- The pagination on the index page uses your system typeface's tabular numbers feature, where possible. This prevents the width of the page indicator changing.

- This template just hides all of Blot's search functionality, since it's not as useful for photos.

- The years in the footer indicate the range of published works. It sometimes looks a little silly if you have only published stuff this year but just you wait.

- When there is no pagination, we instead list the number of entries displayed on the page to maintain the balance of the navigation's layout.

- The thumbnail's computed width and height to block out the layout quickly so nothing has to be recalculated as each image makes its way down the tubes.

- Thumbnails are never cropped. They are always displayed in the aspect ratio chosen by the photographer. To do otherwise seemes rude. Of course, this complicates the layout but that is my job.

{<>} I'm going to borrow a few of the features of the archive's template[^footnote]

{>|} ![Image](/_image_cache/560717cb-4ad7-4fb3-923d-09ad705eb282.jpg)

Things to do:

http://spectorbooks.com/under-the-radar

[^footnote]: Test, [Link](https://google.com).