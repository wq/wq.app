#!/bin/bash
set -e;

function test_command {
    CMD=$1;
    echo
    echo Testing wq $CMD...;
    cd $CMD;
    rm -rf output/;
    mkdir output;
    wq $CMD;
    diff -r expected/ output/
    cd ..;
}

test_command collectjson;
test_command mustache;
test_command optimize;
test_command scss;
