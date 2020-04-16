<aql_edit>
  <virtual if={can_access}>
    <div uk-alert class="uk-alert-warning" if={locked_by}>
      <i class="fas fa-lock"></i> This file is locked by { locked_by }
    </div>
    <ul uk-tab>
      <li><a href="#">aqls</a></li>
      <li each={ i, k in sub_models }><a href="#">{ k }</a></li>
    </ul>

    <ul class="uk-switcher uk-margin">
      <li>
        <h3>Editing aql</h3>
        <form onsubmit="{ save_form }" class="uk-form" id="form_aql">
        </form>
        <a class="uk-button uk-button-secondary" onclick="{ duplicate }">Duplicate</a>
      </li>
      <li each={ i, k in sub_models }>
        <div id={ k } class="crud"></div>
      </li>
    </ul>
  </virtual>
  <virtual if={!can_access && loaded}>
    Sorry, you can't access this page...
  </virtual>

  <script>
    var self = this
    self.can_access = false
    self.loaded = false
    self.locked_by = null

    save_form(e) {
      e.preventDefault()
      common.saveForm("form_aql", "cruds/aqls",opts.aql_id)
    }

    duplicate(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/aqls/" + self.aql._key + "/duplicate", function(data) {
          route('/aqls/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }

    common.get(url + "/cruds/aqls/" + opts.aql_id, function(d) {
      self.aql = d.data
      self.locked_by = d.data.locked_by
      self.fields = d.fields
      self.sub_models = d.fields.sub_models
      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.aql, fields, '#form_aql', 'aqls', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "aql_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.aql_id,
              parent_name: "aqls" })
          })
        })
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
</aql_edit>

<aql_new>
  <virtual if={can_access}>
    <h3>Creating aql</h3>
    <form onsubmit="{ save_form }" class="uk-form" id="form_new_aql">
    </form>
  </virtual>
  <virtual if={!can_access && loaded}>
    Sorry, you can't access this page...
  </virtual>
  <script>
    var self = this
    self.can_access = false
    self.loaded = false

    save_form(e) {
      e.preventDefault()
      common.saveForm("form_new_aql", "cruds/aqls")
    }

    common.get(url + "/cruds/aqls/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {
          // Ignore sub models if any
          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_aql', 'aqls');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
  </script>
</aql_new>

<aqls>
  <virtual if={can_access}>
    <div class="uk-float-right">
      <a href="#aqls/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New aql</a>
      <a if={ export } onclick="{ export_data }" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a>
    </div>
    <h3>Listing aqls</h3>

    <form onsubmit={filter} class="uk-margin-top">
      <div class="uk-inline uk-width-1-1">
        <span class="uk-form-icon" uk-icon="icon: search"></span>
        <input type="text" ref="term" id="term" class="uk-input" autocomplete="off">
      </div>
    </form>
    <table class="uk-table uk-table-striped">
      <thead>
        <tr>
          <th if={sortable} width="20"></th>
          <th each={ col in cols }>{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th>
          <th width="70"></th>
        </tr>
      </thead>
      <tbody id="list">
        <tr each={ row in data } >
          <td if={sortable}><i class="fas fa-grip-vertical handle"></i></td>
          <td each={ col in cols } class="{col.class}">
            <virtual if={ col.toggle == true } >
              <virtual if={ col.tr == true }><a onclick={toggleField} data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual>
              <virtual if={ col.tr != true }><a onclick={toggleField} data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name) }</a></virtual>
            </virtual>

            <virtual if={ col.toggle != true } >
              <virtual if={ col.type == "image" }>
                <img src="{_.get(row,col.name)[locale]} " style="height:25px">
              </virtual>
              <virtual if={ col.type != "image" }>
                { calc_value(row, col, locale) }
              </virtual>
            </virtual>
          </td>
          <td class="uk-text-center" width="110">
            <a onclick={edit} class="uk-button uk-button-primary uk-button-small"><i class="fas fa-edit"></i></a>
            <a onclick={ destroy_object } class="uk-button uk-button-danger uk-button-small" ><i class="fas fa-trash-alt"></i></a>
          </td>
        </tr>
      </tbody>
    </table>
    <ul class="uk-pagination">
      <li if={ page > 0 } ><a onclick={ previousPage }><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li>
      <li if={ (page + 1) * perpage < count} class="uk-margin-auto-left"><a onclick={ nextPage }>Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li>
    </ul>
    Per Page : {perpage > 100000 ? 'ALL' : perpage}
    <a onclick={ setPerPage } class="uk-label">25</a>
    <a onclick={ setPerPage } class="uk-label">50</a>
    <a onclick={ setPerPage } class="uk-label">100</a>
    <a onclick={ setPerPage } class="uk-label">500</a>
    <a onclick={ setPerPage } class="uk-label">1000</a>
    <a onclick={ setPerPage } class="uk-label">ALL</a>
  </virtual>
  <virtual if={!can_access && loaded}>
    Sorry, you can't access this page...
  </virtual>
  <style>
    .handle { cursor: move; }
  </style>
  <script>

    var self        = this
    this.page       = 0
    this.perpage    = localStorage.getItem("perpage") || per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/aqls/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        self.export = !!d.model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(d.model.columns) self.cols = d.model.columns
        self.count = d.data[0].count
        self.sortable = !!d.model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = d.model.roles === undefined || _.includes(d.model.roles.read, me.role)
          self.update()
        })
      })
    }
    this.loadPage(1)

    ////////////////////////////////////////////////////////////////////////////
    calc_value(row, col, locale) {
      value = _.get(row, col.name)
      if(col.tr) { value = value[locale] }
      if(col.truncate) { value = value.substring(0,col.truncate) }
      if(col.capitalize) { value = _.capitalize(value) }
      if(col.uppercase) { value = _.toUpper(value) }
      if(col.downcase) { value = _.toLower(value) }
      return value
    }

    ////////////////////////////////////////////////////////////////////////////
    filter(e) {
      e.preventDefault();
      if(self.refs.term.value != "") {
        $(".uk-form-icon i").attr("class", "uk-icon-spin uk-icon-spinner")
        common.get(url + "/cruds/aqls/search/"+self.refs.term.value, function(d) {
          self.data = d.data
          $(".uk-form-icon i").attr("class", "uk-icon-search")
          self.update()
        })
      }
      else {
        self.loadPage(1)
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    edit(e) {
      route("/aqls/" + e.item.row._key + "/edit")
    }

    ////////////////////////////////////////////////////////////////////////////
    nextPage(e) {
      self.page += 1
      self.loadPage(self.page + 1)
    }

    ////////////////////////////////////////////////////////////////////////////
    previousPage(e) {
      self.page -= 1
      self.loadPage(self.page + 1)
    }

    ////////////////////////////////////////////////////////////////////////////
    destroy_object(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.delete(url + "/cruds/aqls/" + e.item.row._key, function() {
          self.loadPage(self.page + 1)
        })
      }, function() {})
    }

    ////////////////////////////////////////////////////////////////////////////
    toggleField(e) {
      e.preventDefault()
      common.patch(url + "/cruds/aqls/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
        if(data.success) {
          e.target.innerText = data.data
        }
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    setPerPage(e) {
      e.preventDefault()
      var perpage = parseInt(e.srcElement.innerText)
      localStorage.setItem("perpage", perpage)
      if(e.srcElement.innerText == 'ALL') perpage = 1000000000;
      this.perpage = perpage
      this.loadPage(1)
    }

    ////////////////////////////////////////////////////////////////////////////
    export_data(e) {
      common.get(url + '/cruds/aqls/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "aqls.csv")
        link.innerHTML= "Click Here to download"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    this.on('updated', function() {
      if(self.sortable) {
        var el = document.getElementById('list');
        var sortable = new Sortable(el, {
          animation: 150,
          ghostClass: 'blue-background-class',
          handle: '.fa-grip-vertical',
          onSort: function (/**Event*/evt) {
            common.put(
              url + 'cruds/aqls/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
  </script>
</aqls>

