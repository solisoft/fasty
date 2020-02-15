#!/bin/bash
node cypress/setup_test.js
cd foxxy
foxxy upgrade settings --server fasty --database db_test
foxxy upgrade --server fasty --database db_test
cd ..
./node_modules/cypress/bin/cypress run -b chrome --headless