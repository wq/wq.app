set -e
if [ "$LINT" ]; then
    echo "FIXME"
else
    cd tests/commands;
    ./test_commands.sh
    cd ../..;
    npm test
fi
