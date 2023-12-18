# About

{>|} [Download the folder](/folder.zip) (22mb) from which this website is generated.  [View the source](https://github.com/davidmerfield/Blot/tree/master/app/templates/photos) for the photos template to see how it works.

The purpose of the 'Photos' template is to display photos. Its navigation should get out of the way when you are looking at photos. It should offer a way to browse photos at different sizes. The [homepage](/) shows a feed a of recently published photos. The [archives](/archives) give an overview of all the photos published on this site.

All of the the images on this site are courtesy of the [IEMS](http://iems-ferox.com). Many thanks to Dr Rudolph H. Obrist and the brave souls on the [Ferox expedition](http://iems-ferox.com) for their kind contributions to the public domain.

## Theft 

Georgia Kareola's [website](https://notapipe.today) is the source of the layout for this template. I like the menu's grid and the typography of the subpages in particular.

Gavin Atkinson's [compilation of image user interfaces](https://www.are.na/gavin-atkinson-1489764520/image-ui) was a useful source of interesting techniques to navigate and index images.

Hofstede's [archives page](http://www.hofstede.com.au/) has a really pleasing hover effect, with the thumbnail for the hovered link displayed to the left.

The good work of the people at [Are.na](https://are.na) and [Cargo Collective](https://cargocollective.com/) is a constant source of motivation.

I like the subtle animation and controls of the video overlay on [Pentagram's website](https://www.pentagram.com/about/michael-bierut) 

## The design

I tried to keep things as quiet as possible. When designing a theme, it's easy to get lost in the ornamentation of the theme's *chrome*, its menu bar, its search field. I tried to focus on the details. Here are a few things which I have done to this template which might not meet the eye:

- Thumbnails are never cropped. They are always displayed in the aspect ratio chosen by the photographer. To do otherwise seemes rude. Of course, this complicates the layout but that is my job. I think that layouts which do not respect the aspect ratio chosen by the photographer are lazy.

- The pagination on the index page uses your system typeface's [tabular numbers](https://www.fonts.com/content/learning/fontology/level-3/numbers/proportional-vs-tabular-figures) feature, where possible. This prevents the width of the page indicator changing.

- The years in the footer indicate the range of published works. It sometimes looks a little silly if you have only published this year but just be patient!

- When there is no pagination, we instead list the number of entries displayed on the page to maintain the balance of the navigation's layout.


## Technical details

- This template just hides all of Blot's search functionality, since it's not as useful for photos.

- The thumbnail's computed width and height is used to block out the layout of the index page before the images load. This means that nothing has to be recalculated as each image makes its way down the tubes. This prevents the layout 'shifting', something I think makes websites feel flimsy.

- The fade-on-load feature for the grid of images uses a tiny amount of JavaScript and a css class.

*Please [contact me](https://blot.im/contact) if you have any questions. I'm always happy to hear about bugs. [View the source file for this page](?source=true) to see how the layout for this page was marked up.*


[^footnote]: Test, [Link](https://google.com).