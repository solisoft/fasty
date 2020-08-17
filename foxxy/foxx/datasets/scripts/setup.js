'use strict';
const db = require('@arangodb').db
const _ = require('lodash')

function create_collection(collection) {
  if (!db._collection(collection)) {db._createDocumentCollection(collection); }
}

create_collection('activities');
create_collection('datasets');
create_collection('datatypes');

db._collection('datasets').ensureIndex({
  type: 'fulltext',
  fields: ['search']
});

db._collection('datasets').ensureIndex({
  type: 'skiplist',
  fields: ['type']
});

db._removeByExample({ is_system: true })

var models = require("../models.js")

_.each(_.keys(models), function(key) {
  var model = models[key]
  db.datatypes.save({
    name: key, slug: key, javascript: JSON.stringify(model), is_system: true
  })
})