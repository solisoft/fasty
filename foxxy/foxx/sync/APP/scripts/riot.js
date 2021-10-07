'use strict';
const db = require('@arangodb').db;
const request = require('@arangodb/request');
const params = module.context.argv[0];

var response = request.post(params.url + "/riotjs", {
  form: { token: params.token, name: params.name, id: params.id }
})
const object = db.components.document(params.id)
db.components.update(object, { javascript: response.body })
