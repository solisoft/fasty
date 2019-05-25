<settings>
  <h3 if={can_access}>settings</h3>

  <form onsubmit="{ save_form }" id="form_settings">
  </form>
  <virtual if={!can_access && loaded}>
    Sorry, you can't access this page...
  </virtual>
  <script>
    var self = this;
    this.can_access = false
    this.loaded     = false

    save_form(e) {
      e.preventDefault()
      common.saveForm("form_settings", "settings", _this.obj._key)
    }

    var _this = this;

    common.get(url + "settings/", function(d) {
      _this.obj = d.data
      common.get(url + "/auth/whoami", function(me) {
        self.update()
        self.loaded = true
        self.can_access = d.roles === undefined || _.includes(d.roles.write, me.role)
        if(self.can_access) common.buildForm(_this.obj, d.fields, '#form_settings')
        self.update()
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_tag").select2({ tags: true })
    })
  </script>
</settings>

