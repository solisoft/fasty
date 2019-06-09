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
    <li each={lang in langs} class="{lang == window.localStorage.getItem('foxx-locale') ? 'uk-active' : ''}"><a onclick={changeLang}>{lang}</a></li>

    <li><a href="#logout"><i class="uk-icon-sign-out"></i> Logout</a></li>
  </ul>

  <script>
    this.langs = ['en', 'fr']
    changeLang(e) {
      window.localStorage.setItem('foxx-locale', e.item.lang)
      document.location.reload()
    }
  </script>
</rightnav>