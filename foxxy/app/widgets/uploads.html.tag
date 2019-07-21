<images>
  <div class="sortable_{opts.field}" style="user-select: none;">
    <virtual each={ row in data }>
      <div uk-grid class="uk-grid-small" data-id="{ row._key }">
        <div class="uk-width-1-5"><a href="{row.url}" target="_blank"><img src="{ row.url }" alt="" style="max-width: 100%"></a></div>
        <div class="uk-width-3-5">{ row.filename.split('/')[row.filename.split('/').length - 1] }<br>{ prettyBytes(row.length) }</div>
        <div class="uk-width-1-5 uk-text-center"><a onclick={ delete_asset } uk-icon="icon: trash"></a></div>
      </div>
    </virtual>

  </div>
  <style>
    images div, images span { color: white; }
  </style>
  <script>
    var _this = this
    this.data = []

    var use_i18n = ""
    if(opts.i18n != "undefined") use_i18n = "/" + window.localStorage.getItem("foxx-locale")
    common.get(url + "uploads/" + opts.id + '/' + opts.field + use_i18n, function(d) {
      _this.data = d
      _this.update()
    })

    $(function() {
      UIkit.sortable(".sortable_" + opts.field, {}) 
      UIkit.util.on(".sortable_" + opts.field, 'moved', function(data) {
        var i = 0
        var ids = _.map($(".sortable_" + opts.field+" > div"), function(el) {
          return { k: "" + $(el).data("id"), c: i++ }
        })
        common.post(url+"uploads/reorder", JSON.stringify({ ids: ids }), function(d) {
          if(d.success) {
            UIkit.notification({
              message : 'Successfully reordered!',
              status  : 'success',
              timeout : 1000,
              pos     : 'bottom-right'
            });
          }
        })
      })
    })

    delete_asset(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.delete(url + "uploads/" + e.item.row._key, function() {
          $('[data-id='+e.item.row._key+']').remove()
        })
      }, function() {})
    }
  </script>
</images>

<files>
  <div class="sortable_{opts.field}" style="user-select: none;">
    <virtual each={ row in data }>
      <div uk-grid class="uk-grid-small" data-id="{ row._key }">
        <div class="uk-width-3-5">{ row.filename } <a href="{row.url}" target="_blank"><i class="fas fa-external-link-alt"></i></a></div>
        <div class="uk-width-1-5 uk-text-right">{ prettyBytes(row.length) }</div>
        <div class="uk-width-1-5 uk-text-center"><a onclick={ delete_asset } uk-icon="icon: trash"></a></div>
      </div>
  </div>
  <style>
    files div, files span { color: white; }
  </style>
  <script>
    var _this = this;
    this.data = []

    var use_i18n = ""
    if(opts.i18n != "undefined") use_i18n = "/" + window.localStorage.getItem("foxx-locale")

    common.get(url + "uploads/" + opts.id + '/' + opts.field + use_i18n, function(d) {
      _this.data = d
      _this.update()
    })

    filename(row) {
      return row.path.split('/').slice(2).join('/')
    }

    $(function() {
      UIkit.sortable(".sortable_" + opts.field, {}) 
      UIkit.util.on(".sortable_" + opts.field, 'moved', function(data) {
        var i = 0
        var ids = _.map($(".sortable_" + opts.field+" > div"), function(el) {
          return { k: "" + $(el).data("id"), c: i++ }
        })
        common.post(url+"uploads/reorder", JSON.stringify({ ids: ids }), function(d) {
          if(d.success) {
            UIkit.notification({
              message : 'Successfully reordered!',
              status  : 'success',
              timeout : 1000,
              pos     : 'bottom-right'
            });
          }
        })
      })
    })

    delete_asset(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.delete(url + "uploads/" + e.item.row._key, function() {
          $('[data-id='+e.item.row._key+']').remove()
        })
      }, function() {})
    }
  </script>
</files>