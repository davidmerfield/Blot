Pitfalls
--------
* Leaky global state
* Error messages showing up under wrong reporter
* If you quit tests halfway though, reset the db, because the teardown functions to delete blogs, empty tmp dirs wont have run
