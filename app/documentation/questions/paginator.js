module.exports = function Paginator(page, itemsPerPage, totalItems, base) {
  // Data for pagination
  let pages_count = Math.ceil(totalItems / itemsPerPage);

  // Paginator object for the view
  let paginator = {};

  // total pages
  let next_page = false;
  let previous_page = false;

  if (page < pages_count) next_page = page + 1; // next page value only if current page is not last
  if (page > 1) previous_page = page - 1; // next page value only if current page is not last

  if (pages_count > 1) {
    // create paginator only if there are more than 1 pages
    paginator = {
      pages: [], // array of pages [{page: 1, current: true}, {...}, ... ]
      next_page: next_page, // next page int
      previous_page: previous_page, // next page int
      topics_count: totalItems, // total number of topics
    };

    // Produces pagination links like this:
    // 1 ... 56 57 [58] 59 60 ... 90

    const number_of_links_each_side_of_current_page = 2;

    for (let i = 1; i <= pages_count; i++) {
      // filling pages array
      if (
        i === 1 ||
        i === page ||
        i === pages_count ||
        (i < number_of_links_each_side_of_current_page * 2 + 1 &&
          page < number_of_links_each_side_of_current_page * 2 + 1) ||
        Math.abs(page - i) < number_of_links_each_side_of_current_page + 1
      ) {
        paginator.pages.push({ page: i, current: i === page, base });
      } else if (
        Math.abs(page - i) === number_of_links_each_side_of_current_page + 1 ||
        (i === number_of_links_each_side_of_current_page * 2 + 1 &&
          page < number_of_links_each_side_of_current_page * 2 + 1)
      ) {
        paginator.pages.push({ elipsis: true });
      }
    }
  }

  return paginator;
};
