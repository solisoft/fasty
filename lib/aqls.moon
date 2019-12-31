{
  aqls: {
    settings: '
      LET g_settings = (FOR doc IN settings LIMIT 1 RETURN doc)
      LET g_redirections = (FOR doc IN redirections RETURN doc)
      LET g_trads = (FOR doc IN trads RETURN ZIP([doc.key], [doc.value]))
      LET g_components = (
        FOR doc IN components RETURN ZIP([doc.slug], [{ _key: doc._key, _rev: doc._rev }])
      )
      LET g_aqls = (FOR doc IN aqls RETURN ZIP([doc.slug], [doc.aql]))
      LET g_helpers = (
        FOR h IN helpers
          FOR p IN partials
            FILTER h.partial_key == p._key
            FOR a IN aqls
              FILTER h.aql_key == a._key
              RETURN ZIP([h.shortcut], [{ partial: p.slug, aql: a.slug }])
      )
      RETURN { components: g_components, settings: g_settings,
        redirections: g_redirections, aqls: g_aqls,
        trads: MERGE(g_trads), helpers: MERGE(g_helpers) }'
  }

}