const db = require('@arangodb').db

const model = function() {
  var partials = db._query("FOR doc in partials FILTER doc.builder == true RETURN [doc.slug, doc.name]").toArray();
  return {
    model: [
      { r: true, c: "1-2", n: "name", t: "string", j: "joi.string().required()", l: "Name" },
      { r: false, c: "1-2", n: "page_builder", t: "list", j: "joi.string().required()", l: "Page Builder", d: partials },
      { r: true, c: "1-1", n: "html", t: "code:html", j: "joi.any()", l: "HTML" },
      { tab: "CSS" },
      { r: true, c: "1-1", n: "i_css", t: "code:scss", j: "joi.any()", l: "Vendors CSS" },
      { r: true, c: "1-1", n: "scss", t: "code:scss", j: "joi.any()", l: "CSS/Sass" },
      { tab: "JS" },
      { r: true, c: "1-1", n: "i_js", t: "code:javascript", j: "joi.any()", l: "Vendors JS" },
      { r: true, c: "1-1", n: "javascript", t: "code:javascript", j: "joi.any()", l: "JS", endtab: true }

    ],
    collection: "layouts",
    columns: [
      { name: "name" },
    ],
    roles: {
      read: ['designer', 'developer', 'admin'],
      write: ['designer', 'developer', 'admin']
    },
  }
}
module.exports = model