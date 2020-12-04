<loading>
  <div class="uk-text-center">
    Loading app ...
    <br><div uk-spinner></div>
  </div>

  <script>
    common.get(url + "auth/whoami", function(d) {
      if(d.username === null) document.location.href="login.html";
      else {
        // Load the widget you want
        localStorage.setItem('resize_api_key', d.resize_api_key)
        route('/welcome')
      }
    })
  </script>
</loading>

<welcome>
  <h1 class="uk-text-center">Welcome aboard</h1>
  <p class="uk-text-center" style="color: white">This is a landing page ... Nothing special here, replace it by what you want !</p>

  <p class="uk-text-center" style="color: white">Find me in <code>app/widgets/loading.html.tag</code></p>

  <h2 class="uk-text-center" style="margin-top:80px"><a href="https://fasty.ovh" target="_blank">Fasty</a> is powered by powerful opensource projects</h2>
  <div class="uk-container uk-text-center" style="color: white;margin-top:80px">
    <div class="uk-column-1-2">
      <div class="uk-margin">
        <a href="https://www.arangodb.com/" target="_blank"><img src="/static/admin/img/ArangoDB-logo-bg.svg" style="height:90px" /></a>
        <br>ArangoDB
      </div>
      <div class="uk-margin">
        <a href="https://openresty.org/en/" target="_blank"><img src="/static/admin/img/logo.png" style="height:90px" /></a>
        <br>openresty
      </div>
      </div>
      <div class="uk-column-1-2">
        <div class="uk-margin">
          <a href="https://riot.js.org/" target="_blank"><img src="/static/admin/img/square.svg" style="height:90px" /></a>
          <br>RiotJS
        </div>
        <div class="uk-margin">
          <a href="https://leafo.net/lapis/" target="_blank"><img src="/static/admin/img/lapis.jpg" style="height:90px" /></a>
          <br>LAPIS
        </div>
      </div>
    </div>
  </div>
</welcome>

<rightnav>
  <ul class="uk-navbar-nav">
    <li><a onclick={deploy} if={settings.deploy_secret != ""}>Deploy</a></li>
    <li each={lang in langs} class="{lang == window.localStorage.getItem('foxx-locale') ? 'uk-active' : ''}"><a onclick={changeLang}>{lang}</a></li>

    <li><a href="#logout"><i class="uk-icon-sign-out"></i> Logout</a></li>
  </ul>

  <script>
    this.settings   = {}
    var self = this

    common.get(url + "/settings", function(settings) {
      self.settings = settings.data
      self.langs = self.settings.langs.split(",")
      if(!_.includes(self.langs, window.localStorage.getItem('foxx-locale'))) {
        window.localStorage.setItem('foxx-locale', self.langs[0])
      }
      self.update()
    })

    changeLang(e) {
      window.localStorage.setItem('foxx-locale', e.item.lang)
      document.location.reload()
    }

    ////////////////////////////////////////////////////////////////////////////
    deploy(e) {
      e.preventDefault()
      if(confirm("Are you sure?")) {
        var url = "/deploy"
        $.post(url, { token: self.settings.token }, function(data) {
          if(data == "site deployed")
            UIkit.notification({
              message : 'Site Deployed Successfully!',
              status  : 'success',
              timeout : 1000,
              pos     : 'bottom-right'
            });
        })
      }
      return false
    }
  </script>
</rightnav>