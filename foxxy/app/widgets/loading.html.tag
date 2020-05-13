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
  <h1>Welcome aboard</h1>
  <p>This is a landing page ... Nothing special here, replace it by what you want !</p>

  <p>Find me in <code>app/widgets/loading.html.tag</code></p>
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