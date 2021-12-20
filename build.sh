#!/usr/bin/env sh

echo "Installing dependencies"
yarn
echo "Dependencies installed"

echo "Compiling code"
yarn run build
echo "Code compiled"

echo "Executing tests"
yarn run test
echo "Test executed"