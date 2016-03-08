set -e
if [ "$LINT" ]; then
    jshint js/wq
else
    node-qunit-phantomjs tests/suite.html --verbos
fi
