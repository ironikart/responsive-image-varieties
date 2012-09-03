#!/bin/bash

ug=`which uglifyjs`
if [ -f $ug ]; then
    uglifyjs ./*.js > jquery.mriv.min.js
else
    echo "Uglify js not installed"
fi