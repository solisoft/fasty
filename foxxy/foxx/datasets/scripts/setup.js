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

db.datatypes.removeByExample({ is_system: true })

var models = require("../models.js")()

_.each(_.keys(models), function(key) {
  var model = models[key]
  db.datatypes.save({
    name: key, slug: key, javascript: JSON.stringify(model, null, 2), is_system: true
  })

  if(key == "redirections") {
    db._query(`
      FOR doc IN @@col FILTER !HAS(doc, 'type_redirection')
      UPDATE({ _key: doc._key, type_redirection: doc.type }) IN @@col`,
      { "@col": key })
  }
  db._query(`
    FOR doc IN @@col
    UPDATE({ _key: doc._key, type: @val }) IN @@col`,
    { "@col": key, val: key })
})

_.each(["api_routes", "api_libs", "api_scripts", "api_tests"], function(key) {
  db._query(`
    FOR doc IN @@col
    UPDATE({ _key: doc._key, type: @val, parent_id: doc.api_id }) IN @@col`,
    { "@col": key, val: key })
})
