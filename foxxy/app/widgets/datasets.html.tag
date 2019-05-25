<all_datatypes>
  <div class="rightnav uk-card uk-card-default uk-card-body">
    <ul class="uk-nav-default uk-nav-parent-icon" uk-nav>
      <li class="uk-nav-header">Datasets</li>
      <li each={datatypes}><a href="#datasets/{slug}">{name}</a></li>
    </ul>
  </div>
  <script>
    var self = this
    this.datatypes = []
    common.get(url + "/datasets/datatypes", function(data) {
      self.datatypes = data
      self.update()
    })
  </script>
  <style>

  </style>
</all_datatypes>

<dataset_edit>
  <virtual if={can_access}>
    <ul uk-tab>
      <li><a href="#">datasets</a></li>
    </ul>

    <ul class="uk-switcher uk-margin">
      <li>
        <h3>Editing {opts.datatype}</h3>
        <form onsubmit="{ save_form }" class="uk-form" id="form_dataset">
        </form>
        <a class="uk-button uk-button-secondary" onclick="{ duplicate }">Duplicate</a>
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

    save_form(e) {
      e.preventDefault()
      common.saveForm("form_dataset", "datasets/" + opts.datatype ,opts.dataset_id)
    }

    duplicate(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/datasets/"+ opts.datatype +"/" + self.dataset._key + "/duplicate", function(data) {
          route('/datasets/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }

    common.get(url + "/datasets/" + opts.datatype + "/" + opts.dataset_id, function(d) {
      self.dataset = d.data
      self.fields = d.fields

      if(!_.isArray(self.fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.dataset, self.fields, '#form_dataset', 'datasets/' + opts.datatype,
          function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
          })
        })
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
</dataset_edit>

<dataset_new>
  <virtual if={can_access}>
    <h3>Creating {opts.datatype}</h3>
    <form onsubmit="{ save_form }" class="uk-form" id="form_new_dataset">
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
      common.saveForm("form_new_dataset", "datasets/" + opts.datatype)
    }

    common.get(url + "/datasets/"+ opts.datatype + "/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {
          var fields = d.fields
          common.buildForm({}, fields, '#form_new_dataset', 'datasets/' + opts.datatype);
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
  </script>
</dataset_new>

<datasets>
  <virtual if={can_access}>
    <div class="uk-float-right">
      <a onclick="{ new_dataset }" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i></a>
      <a if={ export } onclick="{ export_data }" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a>
    </div>
    <h3>Listing { opts.datatype }</h3>

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
          <th each={ col in cols } class="{col.class}">{col.name == undefined ? col : col.label === undefined ? col.name : col.label}</th>
          <th width="70"></th>
        </tr>
      </thead>
      <tbody id="list">
        <tr each={ row in data } no-reorder>
          <td if={sortable}><i class="fas fa-grip-vertical handle"></i></td>
          <td each={ col in cols } class="{col.class}">
            <virtual if={ col.toggle == true } >
              <virtual if={ col.tr == true }><a onclick={toggleField} data-key="{row._key}">{col.values ? col.values[row[col.name][locale]] : _.get(row,col.name)[locale]}</a></virtual>
              <virtual if={ col.tr != true }><a onclick={toggleField} data-key="{row._key}">{col.values ? col.values[row[col.name]] : _.get(row,col.name) }</a></virtual>
            </virtual>

            <virtual if={ col.toggle != true } >
              <virtual if={ col.type == "image" }>
                <img src="{calc_value(row, col, locale)} " style="height:25px">
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
    <ul class="uk-pagination noselect">
      <li if={ page + 1 > 1 } ><a onclick={ previousPage }><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li>
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
  <script>

    var self        = this
    this.page       = 0
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/datasets/"+opts.datatype+"/page/"+pageIndex+"/"+this.perpage, function(d) {
        self.data = d.data[0].data
        var model = d.model
        self.export = !!model.export
        self.cols = _.map(common.array_diff(common.keys(self.data[0]), ["_id", "_key", "_rev"]), function(v) { return { name: v }})
        if(model.columns) self.cols = model.columns
        self.count = d.data[0].count
        self.sortable = !!model.sortable
        common.get(url + "/auth/whoami", function(me) {
          self.loaded = true
          self.can_access = model.roles === undefined || _.includes(model.roles.read, me.role)
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
        common.get(url + "/datasets/"+ opts.datatype +"/search/"+self.refs.term.value, function(d) {
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
      route("/datasets/" + this.opts.datatype + "/" + e.item.row._key + "/edit")
    }

    new_dataset(e) {
      route("/datasets/" + this.opts.datatype + "/new")
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
        common.delete(url + "/datasets/" + opts.datatype + "/" + e.item.row._key, function() {
          self.loadPage(self.page + 1)
        })
      }, function() {})
    }

    ////////////////////////////////////////////////////////////////////////////
    toggleField(e) {
      e.preventDefault()
      common.patch(url + "/datasets/" + opts.datatype + "/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
        if(data.success) {
          e.target.innerText = data.data
        }
      })
    }

    ////////////////////////////////////////////////////////////////////////////
    setPerPage(e) {
      e.preventDefault()
      var perpage = parseInt(e.srcElement.innerText)
      if(e.srcElement.innerText == 'ALL') perpage = 1000000000;
      this.perpage = perpage
      this.loadPage(1)
    }

    ////////////////////////////////////////////////////////////////////////////
    export_data(e) {
      common.get(url + '/datasets/' + opts.datatype + '/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "datasets.csv")
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
              url + 'datasets/'+ opts.datatype +'/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
  </script>
</datasets>

