#!/bin/bash
set -e
VERSION=`python3 -m setuptools_scm | \
        sed s/\.dev/-dev/ | \
        sed s/+/./ | \
        sed "s/\.d[0-9]\{8\}$//" | \
        sed "s/^\([0-9]\+\.[0-9]\+\.[0-9]\+\)\(.\+\)/\1-\2/" | \
        sed "s/--/-/g"`
sed -i "s/\"version\": .*/\"version\": \"$VERSION\",/" packages/*/package.json
sed -i "s/\"@wq\/\(.\+\)\": \".\+\"/\"@wq\/\1\": \"\^$VERSION\"/" packages/*/package.json
