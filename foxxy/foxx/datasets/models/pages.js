const model = function () {
  return {
    model: [
      { r: true, c: "3-4", n: "name", t: "string", j: "joi.string().required()", l: "Name", tr: true },
      { r: false, c: "1-4", n: "layout_id", t: "list", j: "joi.string().required()", l: "Layout", d: "FOR doc in layouts RETURN [doc._id, doc.name]" },
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
    roles: {
      read: ['editor', 'developer', 'admin'],
      write: ['editor', 'developer', 'admin']
    },
    act_as_tree: true,
    sort: "SORT doc.name[@lang] ASC"
  }
}
module.exports = model