const db = require('@arangodb').db

const model = function () {
  var layouts = db._query(`FOR doc in layouts RETURN [doc._id, doc.name]`).toArray()
  return {
    model: [
      { r: true, c: "3-4", n: "name", t: "string", j: "joi.string().required()", l: "Name", tr: true },
      { r: false, c: "1-4", n: "layout_id", t: "list", j: "joi.string().required()", l: "Layout", d: layouts },
      { r: true, c: "1-1", n: "slug", t: "string", j: "joi.string().required()", l: "Slug", tr: true },
      { r: true, c: "1-1", n: "raw_html", t: "code:html", j: "joi.any()", l: "HTML", tr: true },
      { r: true, c: "1-1", n: "html", t: "html", j: "joi.any()", l: "Content", tr: true },
      { r: true, c: "1-1", n: "description", t: "text", j: "joi.any()", l: "Description", tr: true },

      { r: true, c: "1-1", n: "og_title", t: "string", j: "joi.any()", l: "og:title", tr: true },
      { r: true, c: "1-1", n: "og_img", t: "string", j: "joi.any()", l: "og:img", tr: true },
      { r: true, c: "1-1", n: "og_type", t: "string", j: "joi.any()", l: "og:type", tr: true },
      { r: true, c: "1-1", n: "canonical", t: "string", j: "joi.any()", l: "Canonical URL", tr: true },
      { r: true, c: "1-1", n: "og_aql", t: "code:aql", j: "joi.any()", l: "og:aql", tr: true },
      { r: true, c: "1-2", n: "ba_login", t: "string", j: "joi.any()", l: "Basic Auth : Username" },
      { r: false, c: "1-2", n: "ba_pass", t: "string", j: "joi.any()", l: "Basic Auth : Password" }

    ],
    collection: "pages",
    columns: [
      { name: "name", tr: true },
      { name: "slug", tr: true },
      { name: "online", toggle: true, values: { true: "online", false: "offline" } },
      { name: "published_at" },
    ],
    //slug: ["title"],
    roles: {
      read: ['editor', 'developer', 'admin'],
      write: ['editor', 'developer', 'admin']
    },
    act_as_tree: true,
    //sortable: true,
    sort: "SORT doc.name[@lang] ASC",
    //search: ["title", "barcode", "desc"],
    //includes: {
    //  conditions: "FOR c IN customers FILTER c._key == doc.customer_key",
    //  merges: ", customer: c "
    //},
    //timestamps: true,
    //
    // 1-n relations
    // Don't forget to create your collection in setup.js
    //sub_models: {
    //  authors: {
    //    fields: [
    //      { r: true, c: "1-1", n: "post_id", t: "hidden", j: joi.string().required(), l: "Post ID" },
    //      { r: true, c: "1-1", n: "name", t: "string", j: joi.string().required(), l: "Name" },
    //    ],
    //    singular: "author",
    //    key: "post_id",
    //    columns: [{ name: "name", tr: false, class: ""}, ...], // Displayed on listing
    //    includes: {
    //      conditions: "FOR c IN customers FILTER c._key == doc.customer_key",
    //      merges: "customer: c "
    //    },
    //    timestamps: true,
    //  },
    //}
  }
}
module.exports = model