document.removeEventListener("keydown", function() {})
document.addEventListener("keydown", function(e) {
  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    e.preventDefault();
    $('input[type=submit]:visible').click();
  }
}, false);


$(function () {

  riot.mount('rightnav')

  route('/', function(name) {
    // Here set the / mount
    riot.mount('div#app', 'loading')
  })

  route('/welcome', function(name) {riot.mount('div#app', 'welcome') })

  route('/login', function(name) {riot.mount('div#app', 'login') })
  route('/signup', function(name) {riot.mount('div#app', 'signup') })

  route('/confirm/*', function(id) {
    common.post(url+'auth/confirm', JSON.stringify({ uuid: id }), function() {
      document.location.href = "index.html"
    })
  })

  route('/logout', function(name) {
    common.post(url +"auth/logout", "", function(d) {
      localStorage.removeItem('X-Session-Id')
      document.location.href = "login.html"
    })
  })

  route('/layouts', function() { riot.mount('div#app', 'layouts') })
  route('/pages', function () { riot.mount('div#app', 'pages') })
  route('/pages/*', function (folder_key) {
    riot.mount('div#app', 'pages', { folder_key: folder_key })
  })
  route('/partials', function() { riot.mount('div#app', 'partials') })
  route('/components', function() { riot.mount('div#app', 'components') })
  route('/spas', function() { riot.mount('div#app', 'spas') })
  route('/redirections', function() { riot.mount('div#app', 'redirections') })
  route('/trads', function() { riot.mount('div#app', 'trads') })
  route('/settings', function() { riot.mount('div#app', 'settings') })
  route('/datatypes', function() { riot.mount('div#app', 'datatypes') })
  route('/users', function() { riot.mount('div#app', 'users') })
  route('/aqls', function() { riot.mount('div#app', 'aqls') })
  route('/helpers', function() { riot.mount('div#app', 'helpers') })
  route('/apis', function() { riot.mount('div#app', 'apis') })
  /*@{{router}}*/


  route('/datasets/*', function(type) { riot.mount('div#app', 'datasets', { datatype: type }) })
  route('/datasets/*/new', function (type) {
    riot.mount('div#app', 'dataset_new', { datatype: type })
  })
  route('/datasets/*/*', function (type, folder_key) {
    riot.mount('div#app', 'datasets', { datatype: type, folder_key: folder_key })
  })
  route('/datasets/*/new/*', function (type, folder_key) {
    riot.mount('div#app', 'dataset_new', { datatype: type, folder_key: folder_key })
  })
  route('/datasets/*/*/edit', function(type, id) {
    riot.mount('div#app', 'dataset_edit', { datatype: type, dataset_id: id })
  })

  route(function(collection, id, action) {
    if(action != undefined) {
      if(collection == "layouts") {
        if(action == "edit") { riot.mount('div#app', 'layout_edit', { layout_id: id }) }
      }
      if(collection == "pages") {
        if(action == "edit") { riot.mount('div#app', 'page_edit', { page_id: id }) }
        if(action == "new") { riot.mount('div#app', 'page_new', { folder_key: id }) }
      }
      if(collection == "partials") {
        if(action == "edit") { riot.mount('div#app', 'partial_edit', { partial_id: id }) }
      }
      if(collection == "components") {
        if(action == "edit") { riot.mount('div#app', 'component_edit', { component_id: id }) }
      }
      if(collection == "spas") {
        if(action == "edit") { riot.mount('div#app', 'spa_edit', { spa_id: id }) }
      }
      if(collection == "redirections") {
        if(action == "edit") { riot.mount('div#app', 'redirection_edit', { redirection_id: id }) }
      }
      if(collection == "trads") {
        if(action == "edit") { riot.mount('div#app', 'trad_edit', { trad_id: id }) }
      }
      if(collection == "datatypes") {
        if(action == "edit") { riot.mount('div#app', 'datatype_edit', { datatype_id: id }) }
      }
      if(collection == "users") {
        if(action == "edit") { riot.mount('div#app', 'user_edit', { user_id: id }) }
      }
      if(collection == "aqls") {
        if(action == "edit") { riot.mount('div#app', 'aql_edit', { aql_id: id }) }
      }
      if(collection == "helpers") {
        if(action == "edit") { riot.mount('div#app', 'helper_edit', { helper_id: id }) }
      }
      if(collection == "apis") {
        if(action == "edit") { riot.mount('div#app', 'api_edit', { api_id: id }) }
      }
      /*@{{router_cia}}*/
    }
  })

  route(function(collection, action) {
    if(collection == "layouts" && action == "new") riot.mount('div#app', 'layout_new')
    if(collection == "pages" && action == "new") riot.mount('div#app', 'page_new')
    if(collection == "partials" && action == "new") riot.mount('div#app', 'partial_new')
    if(collection == "components" && action == "new") riot.mount('div#app', 'component_new')
    if(collection == "spas" && action == "new") riot.mount('div#app', 'spa_new')
    if(collection == "redirections" && action == "new") riot.mount('div#app', 'redirection_new')
    if(collection == "trads" && action == "new") riot.mount('div#app', 'trad_new')
    if(collection == "datatypes" && action == "new") riot.mount('div#app', 'datatype_new')
    if(collection == "users" && action == "new") riot.mount('div#app', 'user_new')
    if(collection == "aqls" && action == "new") riot.mount('div#app', 'aql_new')
    if(collection == "helpers" && action == "new") riot.mount('div#app', 'helper_new')
    if(collection == "apis" && action == "new") riot.mount('div#app', 'api_new')
    /*@{{router_ca}}*/
  })


  route.start(true)
  //riot.mount("*")
})
