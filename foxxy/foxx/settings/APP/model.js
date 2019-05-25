const db = require('@arangodb').db
const joi = require('joi')
require("@arangodb/aql/cache").properties({ mode: "on" })

// Sample to load an external collection as list
// var users = db._query(`
//   FOR doc in users RETURN [doc._key, doc.username]
// `).toArray()

// Tags definition sample
// var tags = db._query(`
//   LET tags = (
//     FOR doc IN posts
//       FILTER doc.tags != NULL
//       RETURN doc.tags
//   )
//   RETURN UNIQUE(FLATTEN(tags))
// `).toArray()

// { r: new_row, c: "classname", n: "name/id", t: "type", j: joi.validation(), l: "Label", d: [["data", "list"]] },

// { r: true, c: "1-1", n: "title", t: "string", j: joi.string().required(), l: "Title", tr: true },
// { r: true, c: "1-1", n: "position", t: "integer", j: joi.number().integer(), l: "Position" },
// { r: true, c: "1-1", n: "published_at", t: "date", j: joi.date().format('YYYY-MM-DD').raw().required(), l: "Published_at" },
// { r: true, c: "1-1", n: "time", t: "time", j: joi.string(), l: "Time" },
// { r: true, c: "1-1", n: "desc", t: "text", j: joi.string(), l: "Description" },
// { r: true, c: "1-1", n: "user_key", t: "list", j: joi.string(), l: "User", d: users },
// { r: true, c: "1-1", n: "image", t: "image", j: joi.string(), l: "Pictures" },
// { r: true, c: "1-1", n: "file", t: "file", j: joi.string(), l: "Files" },
// { r: true, c: "1-1", n: "tags", t: "tags", j: joi.array(), l: "Tags", d: tags },
// { r: true, c: "1-1", n: "items", t: "multilist", j: joi.array(), l: "Multi List of tags", d: tags },
// { r: true, c: "1-1", n: "html", t: "code:html", j: joi.any(), l: "Some HTML" },
// { r: true, c: "1-1", n: "scss", t: "code:scss", j: joi.any(), l: "Some SCSS" },
// { r: true, c: "1-1", n: "javascript", t: "code:javascript", j: joi.any(), l: "Some JS" },
// { r: true, c: "1-1", n: "json", t: "code:json", j: joi.any(), l: "Some Json" },

const load_fields = function () {

  return {
    fields: [
      { r: true, c: "1-1", n: "home", t: "code:json", j: joi.string().required(), l: "Home page" },
      { r: true, c: "1-1", n: "langs", t: "string", j: joi.string().required(), l: "Langs" },
      { r: true, c: "1-1", n: "jwt_secret", t: "string", j: joi.string().required(), l: "JWT Secret" },
      { r: true, c: "1-2", n: "upload_path", t: "string", j: joi.string().required(), l: "Upload Path" },
      { r: false, c: "1-2", n: "upload_url", t: "string", j: joi.string().required(), l: "Upload URL" },
      { r: true, c: "1-2", n: "secret", t: "string", j: joi.string().required(), l: "Token" },
      { r: false, c: "1-2", n: "deploy_secret", t: "string", j: joi.any(), l: "Deploy to Token" },
      { r: false, c: "1-1", n: "resize_ovh", t: "string", j: joi.any(), l: "resize.ovh api key" },
      { r: true, c: "1-2", n: "ba_login", t: "string", j: joi.any(), l: "Basic Auth : Username" },
      { r: false, c: "1-2", n: "ba_pass", t: "string", j: joi.any(), l: "Basic Auth : Password" },
    ],
    roles: {
      write: ['developer', 'admin']
    }
  }

}

module.exports = load_fields