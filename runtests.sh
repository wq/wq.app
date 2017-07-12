set -e
if [ "$LINT" ]; then
    jshint js/wq
fi
