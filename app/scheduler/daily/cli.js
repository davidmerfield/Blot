module.exports = function(main) {
  main(function(err, result) {
    if (err) throw err;
    console.log(result);
    process.exit();
  });
};
