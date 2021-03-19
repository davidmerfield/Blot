Name files like this:

YYYY-ID-SEASON.txt

To send out a file:

node scripts/email/newsletter YYYY-ID-SEASON.txt

You can use a database-state I generated to make things easier:

node scripts/state pre-newsletter && node scripts/email/newsletter $(ls app/helper/email/newsletters | tail -n 2 | head -n 1)

Discuss the following and no more:

- New features
- Fixed bugs
- Downtime
- Featured sites

Find PRs using this search query:

https://github.com/davidmerfield/Blot/pulls?q=sort%3Aupdated-asc+is%3Amerged+updated%3A%3E%3D2021-01-08