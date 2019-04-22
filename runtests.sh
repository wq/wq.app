set -e
if [ "$LINT" ]; then
    jshint js/wq
else
    cd tests/commands;
    ./test_commands.sh
    cd ../..;
    npm test
fi
