TESTS = test
REPORTER = spec
XML_FILE = reports/TEST-all.xml
HTML_FILE = reports/coverage.html
ssl = GIT_SSL_NO_VERIFY=true

test: test-mocha
 
test-ci:
	$(MAKE) test-mocha REPORTER=xUnit > $(XML_FILE)
 
test-all: clean test-ci test-cov
 
test-mocha:
	@echo ${ssl}
	@NODE_ENV=test mocha \
	    --timeout 10000 \
	    --reporter ${REPORTER} \
		$(TESTS)
 
test-cov: 
	@echo TRAVIS_JOB_ID=$(TRAVIS_JOB_ID)
	@echo ${ssl}
	@NODE_ENV=test mocha \
	    --timeout 10000 \
	    --require blanket \
		--reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js \
		$(TESTS)
 
clean:
	rm -f reports/*
	rm -fr lib-cov