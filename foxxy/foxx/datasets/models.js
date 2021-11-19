const load_models = function() {
  return {
    // collection_name: require("./models/mymodel.js")(),
    layouts: require('./models/layouts.js')(),
    pages: require('./models/pages.js')(),
    partials: require('./models/partials.js')(),
    components: require('./models/components.js')(),
    spas: require('./models/spas.js')(),
    redirections: require('./models/redirections.js')(),
    trads: require('./models/trads.js')(),
    datatypes: require('./models/datatypes.js')(),
    users: require('./models/users.js')(),
    aqls: require('./models/aqls.js')(),
    helpers: require('./models/helpers.js')(),
    apis: require('./models/apis.js')(),
    scripts: require('./models/scripts.js')(),
    widgets: require('./models/widgets.js')(),
    /*@{{models}}*/
    // Don't remove this models line ...
  }
}

module.exports = load_models