set -e
if [ "$LINT" ]; then
    jshint js/wq
else
    node-qunit-phantomjs http://localhost:8080/tests/suite.html --verbose
fi
