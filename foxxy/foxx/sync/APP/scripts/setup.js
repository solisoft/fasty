'use strict';
const db = require('@arangodb').db;
const crypt = require('@arangodb/crypto');

if (!db._collection('sync_history')) {
  db._createDocumentCollection('sync_history');
}

db._collection('sync_history').ensureIndex({
  type: 'ttl',
  fields: ['date'],
  expireAfter: 43200
});