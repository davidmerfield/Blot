module.exports = function($) {
  console.log($.html());

  var candidates = [];
  var best_guess;

  function calculate_score(el) {
    var score = 0;

    var text = $(el).text();
    var number_of_words = text.split(" ").length;
    var has_numbers = text.match(/\d+/);
    var next_node_starts_with_is =
      el.next &&
      el.next.type === "text" &&
      el.next.data
        .trim()
        .toLowerCase()
        .indexOf("is") === 0;

    // console.log(text, {next_node_starts_with_is: next_node_starts_with_is, has_numbers: has_numbers, number_of_words: number_of_words});
    if (!el.prev) score++;
    if (number_of_words === 2) score++;
    if (next_node_starts_with_is) score++;
    if (number_of_words > 5) score--;
    if (has_numbers) score--;

    return score;
  }

  $("hr + p strong")
    .last()
    .add($("hr + p span strong").last())
    .add($("p span strong").last())
    .add($("p em"))
    .add($("p strong"))
    .each(function(i, el) {
      candidates.push({ text: $(el).text(), score: calculate_score(el) });
    });

  console.log(candidates);

  best_guess = candidates.reduce(function(sum, value) {
    return sum.score > value.score ? sum : value;
  }, candidates[0]);

  console.log("BEST GUESS", best_guess.text);

  return best_guess.text;
};
