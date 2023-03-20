Name files like this:

YYYY-ID-SEASON.txt

To send out a file:

node scripts/email/newsletter YYYY-ID-SEASON.txt

You can use a database-state I generated to make things easier:

node scripts/state newsletter && node scripts/email/newsletter $(ls app/helper/email/newsletters | tail -n 3 | head -n 1)

Find PRs using this search query:

https://github.com/davidmerfield/Blot/pulls?q=sort%3Aupdated-asc+is%3Amerged+updated%3A%3E%3D2022-02-10+author%3A%40me+

Then look at the commits too just in case:

https://github.com/davidmerfield/Blot

Discuss the following and no more:
- New features
- Fixed bugs
- Downtime
- Featured sites