'use strict';
const db = require('@arangodb').db;

function create_collection(collection) {
  if (!db._collection(collection)) {db._createDocumentCollection(collection); }
}

create_collection('activities');
create_collection('datasets');

db._collection('datasets').ensureIndex({
  type: 'fulltext',
  fields: ['search']
});

db._collection('datasets').ensureIndex({
  type: 'skiplist',
  fields: ['type']
});