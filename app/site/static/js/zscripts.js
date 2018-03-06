var scroll = new SmoothScroll('a[href*="#"]', {offset: 160});



var closer = document.getElementById('closer');
var other_play = document.getElementById('other_play');
var play = document.getElementById('play');

if (closer) closer.onclick = function(e) {
  background.classList.remove('open');
  video.src = '';
  e.preventDefault();
  return false;
}

if (play && other_play) other_play.onclick = play.onclick = function (e) {
  background.classList.add('open');
  video.src = 'https://www.youtube.com/embed/_k2NQNj9-LE?rel=0&amp;wmode=transparent&amp;rel=0&amp;autohide=1&amp;controls=0&amp;showinfo=0&amp;theme=light&amp;modestbranding=1&amp;color=white&amp;autoplay=1';
  e.preventDefault();
  return false;
}


if (Stripe) $('form').submit(function(event) {

    var $form = $(this);

    // Disable the submit button
    // to prevent repeated clicks
    $form
      .find('.submit')
      .prop('disabled', true);

    // Validate the email address
    var email = $('#email').val() || '';
    var emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    var email = email.replace(' ', '');

    if (email === '' || !emailRegex.test(email)) {

      $('#error')
        .text('Please enter a valid email.')
        .show();

      $('.submit')
        .prop('disabled', false)

      console.log('should be here')
      return false;

    } else {
      $('#email').val(email)
    }

    Stripe.card.createToken($form, function(status, response){

      if (response.error) {

        $('#error')
          .text(response.error.message)
          .show();

        $('.submit')
          .prop('disabled', false);

      } else {

        var token = response.id;

        // response also contains card,
        // which has additional card details

        // Insert the token into the form so
        // it gets submitted to the server
        $form.find('.stripeToken').val(token);
        $form.get(0).submit();
      }

    });

    // Prevent the form from submitting with the default action
    return false;
});