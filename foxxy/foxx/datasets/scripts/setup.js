'use strict';
const db = require('@arangodb').db;

function create_collection(collection) {
  if (!db._collection(collection)) {db._createDocumentCollection(collection); }
}

create_collection('datasets');