Name files like this:

YYYY-ID-SEASON.txt

To send out a file:

node scripts/email/newsletter YYYY-ID-SEASON.txt

You can use a database-state I generated to make things easier:

node scripts/state pre-newsletter && node scripts/email/newsletter 2020-3-autumn.txt

Discuss the following and no more:

- New features
- Fixed bugs
- Downtime
- Featured sites

