$(document).ready(function(){

  $('.selectTemplate').click(function(e){
    $('input[name=template]').val($(this).data('id'));
    $('form').submit()
    e.preventDefault();
    return false;
  });

});