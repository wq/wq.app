set -e
if [ "$PACKAGE" ]; then
    cd packages/$PACKAGE
    npm run test
else
    npm run test
fi
