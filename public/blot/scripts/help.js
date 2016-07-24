var index = lunr(function () {
    this.field('title', {boost: 10});
    this.field('text');
    this.ref('id');
  });

var questionList = {};

$('.question').each(function(){

  var info = {
    id: $(this).attr('id'),
    text: $(this).find('h2').siblings().text(),
    title: $(this).find('h2').text().slice(0,-1) // has a trailing '8' form the permalink
  };

  console.log(info);

  questionList[info.id] = info;
  index.add(info);
});

var search = document.getElementById('search'),
    searchResults = document.getElementById('searchResults');
 
function doSearch () {
  var results = index.search(search.value);

  searchResults.innerHTML ='';

  if (results.length) {
    $('#resultsContainer').show();
  } else {
    $('#resultsContainer').hide();
  }

  for (var i in results) {

    var id = results[i].ref;
    
    $('#searchResults').append($('#' + id).clone());
  }
}

if (search) {

  search.focus();

  search.onkeyup = function() {

    setTimeout(doSearch, 500);
  }  
}

var searchEl = $('#search'),
    searchBG = $('#searchBG'),
    sideBarEl = $('.sidebar.left.help'),
    sidebarOffset = $('.sidebar.left.help').offset().top,
    searchOffset = $('#searchContainer').offset().top;

$(window).scroll(function() {  

  var scroll = $(window).scrollTop();

  if (scroll >= searchOffset) {
      searchBG.show();
      sideBarEl.css('top', sidebarOffset - searchOffset);      
      sideBarEl.css('position','fixed');
    // searchEl.addClass("fixed");
  } else {
      searchBG.hide();
      sideBarEl.css('position','absolute');
      sideBarEl.css('top','auto');
      // searchEl.removeClass("fixed");
  }
});