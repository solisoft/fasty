const db = require('@arangodb').db
const joi = require('joi')
require("@arangodb/aql/cache").properties({ mode: "on" })
const model = function () {
  return {
    model: [
      { r: true, c: "1-1", n: "name", t: "string", j: "joi.string().required()", l: "Name" },
      { r: true, c: "1-1", n: "html", t: "code:html", j: "joi.any()", l: "HTML/JS" },
      { r: true, c: "1-1", n: "js", t: "code:javascript", j: "joi.any()", l: "Router (JS)" },
    ],
    columns: [
      { name: "name" },
      { name: "slug" }
    ],
    roles: {
      read: ['developer', 'admin'],
      write: ['developer', 'admin']
    },
    slug: ["name"]
  }
}
module.exports = model