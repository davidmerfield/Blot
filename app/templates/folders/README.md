# Folders

Add folders for:

- Link blog!
- Podcast!
- Music site!
  - music album archive with playable records
- Video portfolio!

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

[Portfolio](https://blot.im/templates/blog) – [bjorn](./bjorn)
https://www.flickr.com/photos/alberta_archives/albums/72157643076560675

[Photo](https://blot.im/templates/photo) - [william](./william)
[Bjorn Allard](https://www.flickr.com/photos/swedish_heritage_board/albums/72157650224763869/)'s photos of Sweden

[Reference](https://blot.im/templates/reference) - [frances](./frances)
[Gardening in Color](https://www.flickr.com/photos/library_of_congress/albums/72157629495236312) by Frances

## Tools

- [Download flickr sets](https://www.npmjs.com/package/flickr-set-get)
  https://www.openculture.com/2016/05/1-8-million-free-works-of-art-from-world-class-museums-a-meta-list.html

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

## Ideas

- design a site around each font available on Blot (80 ish fonts)

Backs of oil paintings from the wellcome collection
https://wellcomecollection.org/works/gf94jwmz/images?id=dx3n4cyc

The works of Edward Muybridge
https://wellcomecollection.org/search/images?locations.license=pdm&source.contributors.agent.label=%22Muybridge%2C+Eadweard%2C+1830-1904%22&page=11

## Future test material

[Objects on black](https://commons.wikimedia.org/w/index.php?search=Archaeodontosaurus&title=Special:MediaSearch&go=Go&type=image)

[Collection of botany of museum of toulouse](https://commons.wikimedia.org/wiki/Category:Collection_of_botany_of_the_Mus%C3%A9um_de_Toulouse)

[Pre-colombian art](https://commons.wikimedia.org/wiki/Category:Pre-Columbian_art_in_the_Walters_Art_Museum)

[Objects photographed with black background from prehistory of the Muséum de Toulouse](https://commons.wikimedia.org/wiki/Category:Collection_of_prehistory_of_the_Mus%C3%A9um_de_Toulouse)

[Focus stacking images of plants](https://commons.wikimedia.org/wiki/Category:Focus_stacking_images_of_plants)

[Muséum de Toulouse collection of Lepidoptera](https://commons.wikimedia.org/wiki/Category:Mus%C3%A9um_de_Toulouse_collection_of_Lepidoptera)

### Photographs

[Photochrom Travel Views](https://www.flickr.com/photos/library_of_congress/albums/72157612249760312)

[John Margolie's photos](https://www.loc.gov/pictures/related/?va=exact&st=gallery&q=Nightclubs--1970-1980.&fi=subject&sg=true&op=EQUAL)

[Theodor Horydczak pictures](https://www.loc.gov/pictures/search/?va=exact&co=thc&sp=1&q=Horydczak%2C+Theodor%2C+approximately+1890-1971&fa=displayed%3Aanywhere&fi=author&sg=true&op=EQUAL)

[Daguerreotypes](https://www.loc.gov/pictures/search/?q=Mathew+Brady+half+plate&sp=1&co=dag&st=grid)

[Macro photos](https://www.rawpixel.com/board/1231804/vintage-botanical-macro-photographs-high-resolution-designs?mode=shop)

### Illustrations

[Thought-forms](https://en.wikipedia.org/wiki/Thought-Forms)

- https://archive.org/details/thoughtforms00leadgoog/page/n30/mode/2up?view=theater
- https://archive.org/details/thoughtforms00leadgoog/page/n130/mode/2up?view=theater
- https://www.gutenberg.org/files/16269/16269-h/16269-h.htm#THE_FORM_AND_ITS_EFFECT
- https://en.wikipedia.org/wiki/Theosophy_and_visual_arts#Beckmann
- https://upload.wikimedia.org/wikipedia/commons/c/cd/Colorchart.jpg

[Works of Mondrian](https://commons.wikimedia.org/wiki/Category:Paintings_by_Piet_Mondrian)

[British Fishes](https://www.rawpixel.com/board/415979/the-natural-history-british-fishes-free-public-domain-fish-paintings)

[Fern drawings](https://www.rawpixel.com/board/1231857/fern-drawings-public-domain-botanical-paintings)

[Works of Ernst Haekel](https://en.wikipedia.org/wiki/Ernst_Haeckel)

[Cyanotypes of algae](https://digitalcollections.nypl.org/collections/photographs-of-british-algae-cyanotype-impressions?format=html&id=photographs-of-british-algae-cyanotype-impressions&per_page=250&page=1#/?tab=navigation&scroll=112)

[California views by Prang](https://www.loc.gov/pictures/search/?q=California+views+prang&fa=displayed%3Aanywhere&sp=1&co=pga)

[Bird's eye views](https://www.loc.gov/pictures/search/?q=bird+view+of&fa=displayed%3Aanywhere&sp=3&co=pga&st=gallery)

[zoopraxiscopes - Collection of optical illusion disks](https://www.loc.gov/pictures/related/?fi=subject&q=Optical%20illusions--1830-1840.&co=cph)

[Postcards](https://digitalcollections.nypl.org/search/index?filters%5Bgenre%5D=Postcards&filters%5Brights%5D%5B%5D=pd&filters%5Btype_s%5D%5B%5D=http%3A%2F%2Furi.nypl.org%2Fvocabulary%2Frepository_terms%23Capture&keywords=#)

[Botanical illustrations](https://digitalcollections.nypl.org/search/index?filters%5BnamePart_mtxt_s%5D%5B%5D=Miller%2C+Joseph%2C+1668+or+1669-1748&keywords=&layout=false#/?scroll=135)

https://publicdomainreview.org/essay/the-substantiality-of-spirit/?utm_source=newsletter

### Objects

[Civil rights buttons](https://digitalcollections.nypl.org/search/index?filters%5Bgenre_mtxt_s%5D%5B%5D=Buttons+%28Information+artifacts%29&keywords=&layout=false#/?scroll=39)

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

### MUSIC

https://www.loc.gov/collections/national-jukebox/about-this-collection/genres/

https://musopen.org/music/777-peer-gynt-suite-no-1-op-46/

https://freemusicarchive.org/genre/Big_BandSwing/

https://www.gutenberg.org/browse/categories/3

https://www.openmusicarchive.org/browse_tag.php?tag=1928

[Bessie Smith](https://archive.org/details/BessieSmithNivenJazzCollection_tracked)

[ McKinney's Cotton Pickers - Vol. 1 (RCA) 1928 ](https://archive.org/details/08-mc-kinneys-cotton-pickers-vol-1-cherry/01-McKinney's+Cotton+Pickers+vol+1+-+Four+or+five+times.flac)

[Tree Star Moon](https://soundcloud.com/tree-star-moon/sets/cc0-public-domain-music)

https://archive.org/details/georgeblood?and%5B%5D=year%3A%5B1923+TO+1928%5D

https://www.google.com/search?client=firefox-b-d&q=site%3Asoundcloud.com+CC0

https://freepd.com/epic.php

https://en.wikipedia.org/wiki/Test_card#Test_card_music


## Places to find test material

Public domain image archive:
https://pdimagearchive.org/?utm_source=newsletter

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
