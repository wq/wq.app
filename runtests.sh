set -e
if [ "$LINT" ]; then
    jshint js/wq tests/js/suite
else
    cd tests/commands;
    ./test_commands.sh
    cd ../..;
    node-qunit-phantomjs http://localhost:8080/tests/suite.html --verbose --timeout 60
fi
