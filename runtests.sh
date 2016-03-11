set -e
if [ "$LINT" ]; then
    jshint js/wq tests/js/suite
else
    node-qunit-phantomjs http://localhost:8080/tests/suite.html --verbose --timeout 10
fi
