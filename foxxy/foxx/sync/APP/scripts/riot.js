'use strict';
const db = require('@arangodb').db;
const request = require('@arangodb/request');
const params = module.context.argv[0];

var response = request.post(h_settings.base_url + "/riotjs", {
  form: { token: params.secret, name: params.name, tag: params.id }
})


const layout = db.layouts.document(params.id)
db.layouts.update(layout, { compiled_css: response.body })
