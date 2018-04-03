cmd_Release/http_parser.a := rm -f Release/http_parser.a && ./gyp-mac-tool filter-libtool libtool  -static -o Release/http_parser.a Release/obj.target/http_parser/vendor/http_parser/http_parser.o
