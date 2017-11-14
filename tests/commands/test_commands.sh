#!/bin/bash
set -e;

function test_command {
    echo
    if [ -z "$2" ]; then
        CMD=$1;
        echo Testing wq $CMD...;
    else
        CMD=$2;
        PRE_CMD=$1;
        echo "Testing wq $CMD (after $PRE_CMD)...";
    fi;

    cd $CMD;
    rm -rf output/;
    mkdir output;
    if [ ! -z "$PRE_CMD" ]; then
        wq $PRE_CMD;
    fi;
    wq $CMD;
    diff -r expected/ output/
    cd ..;
}

test_command collectjson;
test_command mustache;
test_command optimize;
test_command scss;
test_command optimize babel;
