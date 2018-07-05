$(document).ready(function(){

  $('.plugin > label input[type=checkbox]').click(function(){

    $(this).parent().parent().parent().toggleClass('checked')
  });

  if ($('#selectAnalytics').val() !== 'None') {
    $('#trackingIdInput').show();
  } else {
    $('#trackingIdInput').hide();
  }

  $('#selectAnalytics').change(function(){

    if ($(this).val() !== 'None') {
      $('#trackingIdInput').show();
    } else {
      $('#trackingIdInput').hide();
    }
  });
});  