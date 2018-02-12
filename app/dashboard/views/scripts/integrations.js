$(document).ready(function(){

  $('.plugin input[type=checkbox]').click(function(){

    $(this).parent().parent().toggleClass('checked')
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