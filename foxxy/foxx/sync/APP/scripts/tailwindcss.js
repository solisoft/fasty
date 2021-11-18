'use strict';
const db = require('@arangodb').db;
const request = require('@arangodb/request');
const params = module.context.argv[0];

var response = request.post(params.url + "/tailwindcss", {
  form: { token: params.token, id: params.id, field: params.field }
})

const layout = db.layouts.document(params.id)
db.layouts.update(layout, { compiled_css: response.body })
