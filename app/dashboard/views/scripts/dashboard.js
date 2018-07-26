$('.dropdown .opener').click(function(e){

  $('body').click(function () {
    $('.dropdown').addClass('closed');
  });


  $('.dropdown').toggleClass('closed');

  e.preventDefault();
  return false;
});

// $('.dropdown').hover(function(e){
//   $('.dropdown').removeClass('closed');
//   e.preventDefault();
//   return false;
// });

$('.dropdown .closer').click(function(e){
  $('.dropdown').addClass('closed');
  e.preventDefault();
  return false;
});

// $('.dropdown .closer').hover(function(e){
//   $('.dropdown').addClass('closed');
//   e.preventDefault();
//   return false;
// });

var sortTitle = document.getElementById('sortTitle'),
    sortCreated = document.getElementById('sortCreated'),
    sortFilename = document.getElementById('sortFilename'),
    entryList = document.getElementById('entryList');

var reverseCreated = false,
    reverseTitle = true,
    reversePath = true;

if (sortFilename && sortFilename.onclick) {

  sortFilename.onclick = function (){

    sortTitle.className = 'lightText column two';
    sortCreated.className = 'lightText column four';

    reverseTitle = true;
    reverseCreated = true;

    reversePath = !reversePath;

    if (reversePath) {
      sortFilename.className = 'lightText column four reversed';
    } else {
      sortFilename.className = 'lightText column four normal'
    }

    var entryRows = [].slice.call(document.querySelectorAll("#entryList > .row"));

    entryRows.sort(function(a, b){

      if(a.getAttribute('data-path').toLowerCase() < b.getAttribute('data-path').toLowerCase()) return -1;
      if(a.getAttribute('data-path').toLowerCase() > b.getAttribute('data-path').toLowerCase()) return 1;
      return 0;
    });

    if (reversePath) {
      entryRows.reverse();
    }

    var html = '';

    for (var i = 0; i < entryRows.length; i++) {
      html += entryRows[i].outerHTML;
    }

    entryList.innerHTML = html;
  }
}


if (sortTitle && sortTitle.onclick) {

  sortTitle.onclick = function (){

    reverseTitle = !reverseTitle;

    reversePath = true;
    reverseCreated = true;

    sortCreated.className = 'lightText column four';
    sortFilename.className = 'lightText column four';


    if (reverseTitle) {
      sortTitle.className = 'lightText column two reversed';
    } else {
      sortTitle.className = 'lightText column two normal'
    }

    var entryRows = [].slice.call(document.querySelectorAll("#entryList > .row"));

    entryRows.sort(function(a, b){

      if(a.getAttribute('data-title').toLowerCase() < b.getAttribute('data-title').toLowerCase()) return -1;
      if(a.getAttribute('data-title').toLowerCase() > b.getAttribute('data-title').toLowerCase()) return 1;
      return 0;
    });

    if (reverseTitle) {
      entryRows.reverse();
    }

    var html = '';

    for (var i = 0; i < entryRows.length; i++) {
      html += entryRows[i].outerHTML;
    }

    entryList.innerHTML = html;
  }
}

if (sortCreated && sortCreated.onclick) {

  sortCreated.onclick = function (){

    reverseCreated = !reverseCreated;

    reversePath = true;
    reverseTitle = true;

    sortTitle.className = 'lightText column two';
    sortFilename.className = 'lightText column four';

    if (reverseCreated) {
      sortCreated.className = 'lightText column four reversed';
    } else {
      sortCreated.className = 'lightText column four normal'
    }

    var entryRows = [].slice.call(document.querySelectorAll("#entryList > .row"));

    entryRows.sort(function(a, b){
      return +b.getAttribute('data-created') - +a.getAttribute('data-created');
    });

    if (reverseCreated) {
      console.log(entryRows);
      console.log(typeof entryRows);
      entryRows.reverse();
    }

    var html = '';

    for (var i = 0; i < entryRows.length; i++) {
      html += entryRows[i].outerHTML;
    }

    entryList.innerHTML = html;
  }
}


var newRedirect = window.location.hash.slice(1);

if (newRedirect) {

  var from = 'input[placeholder="from"]';
  var to = 'input[placeholder="to"]';

  var index = $('#redirects').children().length;

  var newRow = $('#new_redirect')
                  .clone()
                  .attr('id','')
                  .find(from)
                    .attr('name', 'redirects.' + index +'.from')
                    .val(newRedirect)
                  .end()
                  .find(to)
                    .attr('name', 'redirects.' + index +'.to')
                  .end()
                  .show();

  $('#redirects').append(newRow);

  newRow.find(to).focus();
}

$('#start').click(function(e){

  var el = $(this);

  $('#stream').html('');

  e.preventDefault();

  el.addClass('working')
    .html('Verifying');

  $.post("?_csrf={{csrftoken}}", function(data){

    el.removeClass('working')
      .html('Start verification');

  });
});

$('button:not(.small)').each(function(){
  $(this).click(function(){
  });
});

  $('#toggleTextarea').click(function () {
    $('#stage').append($('#backstage').children().first());
    $('#backstage').append($('#stage').children().first());
  });

