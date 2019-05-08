set -e
if [ "$LINT" ]; then
    npm run lint
else
    cd tests/commands;
    ./test_commands.sh
    cd ../..;
    npm test
fi
