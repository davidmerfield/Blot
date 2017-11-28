SHELL := /bin/bash

test:
	@mocha -R spec

hint:
	@jshint index.js test.js package.json

# UglifyJS v1.3.4
min:
	@echo -n ';' > event-proxy.min.js; uglifyjs -nc event-proxy.js >> event-proxy.min.js;

all:
	make hint;
	make test;
	make min;

.PHONY: test hint min all
