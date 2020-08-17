const model = function() {
  return {
    model: [
      { r: true, c: "1-3", n: "name", t: "string", j: "joi.string().required()", l: "Name" },
      { r: false, c: "1-3", n: "slug", t: "string", j: "joi.string().required()", l: "Slug" },
      { r: false, c: "1-6", n: "synchronizable", t: "boolean", j: "joi.number().integer()", l: "Synchronizable?" },
      { r: false, c: "1-6", n: "deployable", t: "boolean", j: "joi.number().integer()", l: "Deployable?" },
      { r: true, c: "1-1", n: "javascript", t: "code:json", j: "joi.string().required()", l: "JSON definition" }

    ],
    collection: "datatypes",
    columns: [
      { name: "name" },
      { name: "slug" },
      { name: "synchronizable" }
    ],
    roles: {
      read: ['developer', 'admin'],
      write: ['developer', 'admin']
    },
    //  { name: "title", tr: true, class: "uk-text-right", toggle: true,
    //    values: { true: "online", false: "offline" },
    //    truncate: 20, uppercase: true, lowercase: true
    //  }, ...
    //],
    //slug: ["title"],
    act_as_tree: true,
    //sortable: false,
    sort: "SORT doc.name ASC",
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