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

  route('/settings', function() { riot.mount('div#app', 'settings') })

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
      /*@{{router_cia}}*/
    }
  })

  route(function(collection, action) {
    /*@{{router_ca}}*/
  })


  route.start(true)
  //riot.mount("*")

  if(document.location.host.indexOf("prod.") >= 0) $("body").css("background", "linear-gradient(150deg,#370d13 0,#283a63 100%)")
  if(document.location.host.indexOf("staging.") >= 0) $("body").css("background", "linear-gradient(150deg,#33521c 0,#283a63 100%)")
  if(document.location.host.indexOf("qa.") >= 0) $("body").css("background", "linear-gradient(150deg, rgb(61, 64, 18) 0px, rgb(37, 43, 2) 100%)")
})
