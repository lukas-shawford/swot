#!/bin/bash

set -o errexit  # Exit on error

git checkout heroku
git rebase master
git push --force heroku heroku:master
git push --force origin heroku
git checkout master
