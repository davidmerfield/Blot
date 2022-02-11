# Folders

Test material for static site generators. To release new versions of the folders for download:

```
git tag 1.1 && git push origin 1.1
```

The [Github Action](./github/workflows/release) will automatically zip the folder contents and make them downloadable here:

```
https://github.com/davidmerfield/folders/releases/latest/download/$FOLDER.zip
```

Make sure you update the [Github Action](./github/workflows/release) if you add or remove a folder.

## Folders for each template

[Blog](https://blot.im/templates/blog) - [video](./video)  
An image, a text file, a word document, a bookmark used in Blot's demo video

[Magazine](https://blot.im/templates/blog) - [interviews](./interviews)
[Wikinews's interviews](https://en.wikinews.org/wiki/Category:Interviews)

[Portfolio](https://blot.im/templates/blog) – [bjorn](./bjorn)
https://www.flickr.com/photos/alberta_archives/albums/72157643076560675

[Photo](https://blot.im/templates/photo) - [william](./william)
[Bjorn Allard](https://www.flickr.com/photos/swedish_heritage_board/albums/72157650224763869/)'s photos of Sweden

[Reference](https://blot.im/templates/reference) - [frances](./frances)
[Gardening in Color](https://www.flickr.com/photos/library_of_congress/albums/72157629495236312) by Frances

## Tools

- [Download flickr sets](https://www.npmjs.com/package/flickr-set-get)

## Generating the blogs

You will eventually be able to build these folders into blogs using
the script:

```
node scripts/build/folders
```

How to store links in the menu? How to encode an avatar?
This will be useful food for thought when we allow people
to edit their blog's settings from the folder, e.g.
a .blot directory containing config...

## Future test material

[Photochrom Travel Views](https://www.flickr.com/photos/library_of_congress/albums/72157612249760312)

[Collection of MET cylindrical seals with modern impressions](https://www.metmuseum.org/art/collection/search#!?showOnly=withImage%7CopenAccess&q=cylinder%20seal%20and%20modern%20impression&offset=0&perPage=80&sortOrder=asc&searchField=All&pageSize=0)

[Audio recordings at Yellowstone park](https://www.nps.gov/yell/learn/photosmultimedia/soundlibrary.htm)

[James Jowers black and white street photography](https://www.flickr.com/photos/george_eastman_house/)albums/72157608512488080

[HARD - Illustrations of these London Parks](https://www.biodiversitylibrary.org/page/56636927#page/131/mode/1up)

[HARD - Bird head drawings](https://www.flickr.com/photos/smithsonian/albums/72157651885659630/page2)

[Urban J Kinnet Geologist at Berkeley](https://www.flickr.com/photos/105662205@N04/albums/72157670885525146/page1)

[Vancouver neon in black and white](https://www.flickr.com/photos/99915476@N04/albums/72157636305761336)

[Nasa Mission Patches](https://www.flickr.com/search/?text=nasa%20patches&license=7%2C9%2C10)

[Prelinger video archives](https://archive.org/details/prelinger)

[Morris Huberland's pictures of New York](https://digitalcollections.nypl.org/collections/)morris-huberland#/?tab=about

## Places to find test material

Find a photographer here and create a portfolio of work:
https://commons.wikimedia.org/wiki/Category:Photographs_by_photographer

Find one of these NYPL digital collections
https://digitalcollections.nypl.org/collections#/?scroll=195

Find one of these biological albums
https://www.flickr.com/photos/biodivlibrary/albums

: ephemera: https://ticketsplz.tumblr.com/
ben@shelfheroes.com
https://twitter.com/tkts_plz
https://www.instagram.com/ticketsplz/
curator of public domain: https://nos.twnsnd.co/page/8

https://en.wikinews.org/wiki/Fernando_Torres_signs_contract_extension_with_Atl%C3%A9tico_Madrid?dpl_id=2793772

https://projects.propublica.org/graphics/d4d-hospital-lookup

https://www.propublica.org/archive/P60/

https://www.good.is/features?page=5

https://commons.wikimedia.org/wiki/Category:Botanical_illustrations
https://commons.wikimedia.org/wiki/Category:Familiar_wild_flowers_figured_and_described
http://threedscans.com/
https://commons.wikimedia.org/wiki/Commons:Featured_pictures/Astronomyhttps://commons.wikimedia.org/wiki/Category:Minerals_on_black_background
https://commons.wikimedia.org/wiki/Category:Extinct_plant_diagrams
https://commons.wikimedia.org/wiki/The_North_American_Sylva
https://commons.wikimedia.org/wiki/Category:Beta_vulgaris_-_botanical_illustrations
https://commons.wikimedia.org/wiki/Category:Daucus_carota_-_botanical_illustrations
https://commons.wikimedia.org/wiki/Category:The_Fruits_of_America
https://commons.wikimedia.org/wiki/Category:USDA_Pomological_Watercolors
https://commons.wikimedia.org/w/index.php?title=Category:USDA_Pomological_Watercolors&filefrom=Pomological+Watercolor+POM00000999.jpg%0APomological+Watercolor+POM00000999.jpg
https://www.flickr.com/photos/nasacommons
https://en.wikipedia.org/wiki/Wikipedia:Featured_pictures
https://en.wikipedia.org/wiki/Wikipedia:Featured_pictures/People/Artists_and_writers
https://en.wikipedia.org/wiki/Wikipedia:Featured_pictures/People/Military
https://upload.wikimedia.org/wikipedia/commons/2/24/Brian_Shul_in_the_cockpit_of_the_SR-71_Blackbird.jpg
https://commons.wikimedia.org/wiki/Commons:European_Science_Photo_Competition_2015/Image_categories
https://en.wikipedia.org/wiki/Wikipedia:Wikiproject:Estonian_Science_Photo_Competition

- Good entry points:
  - https://commons.wikimedia.org/wiki/Category:Plants
  - https://commons.wikimedia.org/wiki/Commons:Featured_pictures/Plants
  - https://commons.wikimedia.org/wiki/Category:Gardening
  - https://commons.wikimedia.org/wiki/Category:Gardeners
  - https://commons.wikimedia.org/wiki/File:Antonio,_el_invern%C3%A1culo_y_sus_plantas_(7375398612).jpg
  - https://commons.wikimedia.org/wiki/File:Antonio,_el_ivern%C3%A1culo_y_sus_plantas_(7371797592).jpg
  - https://commons.wikimedia.org/wiki/Category:Gardens
  - https://commons.wikimedia.org/wiki/File:Gardener_Holding_Heirloom_Calypso_Beans_(aka_Yin_Yang).jpg
  - https://commons.wikimedia.org/wiki/Category:Unidentified_pot_plants
  - https://commons.wikimedia.org/wiki/File:Thumbnail-size_potted_plant-_Goyang_International_Flower_Festival_(4560157876).jpg
  - https://commons.wikimedia.org/wiki/Category:Gardening_in_art
  - https://commons.wikimedia.org/wiki/Category:Flowers_in_art
