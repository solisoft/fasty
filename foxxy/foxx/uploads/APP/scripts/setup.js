'use strict';
const db = require('@arangodb').db;
const crypt = require('@arangodb/crypto');
const settings = 'foxxy_settings';
const collection = 'uploads';

const uuid = crypt.genRandomAlphaNumbers(80);



if (!db._collection(collection)) {
  db._createDocumentCollection(collection);
}

db._collection(collection).ensureIndex({
  type: 'skiplist',
  fields: ['object_id'],
  unique: false
});