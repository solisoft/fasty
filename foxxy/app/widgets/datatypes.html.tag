
<datatype_edit>
  <virtual if={can_access}>
    <ul uk-tab>
      <li><a href="#">datatypes</a></li>
      <li each={ i, k in sub_models }><a href="#">{ k }</a></li>
    </ul>

    <ul class="uk-switcher uk-margin">
      <li>
        <h3>Editing datatype</h3>
        <form onsubmit="{ save_form }" class="uk-form" id="form_datatype">
        </form>
        <a class="uk-button uk-button-secondary" onclick="{ duplicate }">Duplicate</a>
      </li>
      <li each={ i, k in sub_models }>
        <div id={ k } class="crud"></div>
      </li>
    </ul>

    <dataset_helper></dataset_helper>
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
      common.saveForm("form_datatype", "cruds/datatypes",opts.datatype_id)
    }

    duplicate(e) {
      UIkit.modal.confirm("Are you sure?").then(function() {
        common.get(url + "/cruds/datatypes/" + self.datatype._key + "/duplicate", function(data) {
          route('/datatypes/' + data._key + '/edit')
          UIkit.notification({
            message : 'Successfully duplicated!',
            status  : 'success',
            timeout : 1000,
            pos     : 'bottom-right'
          });
        })
      }, function() {})
    }

    common.get(url + "/cruds/datatypes/" + opts.datatype_id, function(d) {
      self.datatype = d.data
      self.fields = d.fields
      self.sub_models = d.fields.sub_models

      var fields = d.fields

      if(!_.isArray(fields)) fields = fields.model
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access)
          common.buildForm(self.datatype, fields, '#form_datatype', 'datatypes', function() {
            $(".crud").each(function(i, c) {
            var id = $(c).attr("id")
            riot.mount("#" + id, "datatype_crud_index", { model: id,
              fields: self.sub_models[id].fields,
              key: self.sub_models[id].key,
              singular: self.sub_models[id].singular,
              columns: self.sub_models[id].columns,
              parent_id: opts.datatype_id,
              parent_name: "datatypes" })
          })
        })
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
</datatype_edit>

<datatype_new>
  <virtual if={can_access}>
    <h3>Creating datatype</h3>
    <form onsubmit="{ save_form }" class="uk-form" id="form_new_datatype">
    </form>

    <dataset_helper></dataset_helper>

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
      common.saveForm("form_new_datatype", "cruds/datatypes")
    }

    common.get(url + "/cruds/datatypes/fields", function(d) {
      common.get(url + "/auth/whoami", function(me) {
        self.can_access = d.fields.roles === undefined || _.includes(d.fields.roles.write, me.role)
        self.loaded = true
        self.update()
        if(self.can_access) {
          // Ignore sub models if any
          var fields = d.fields
          if(!_.isArray(fields)) fields = fields.model
          common.buildForm({}, fields, '#form_new_datatype', 'datatypes');
        }
      })
    })

    this.on('updated', function() {
      $(".select_list").select2()
      $(".select_mlist").select2()
      $(".select_tag").select2({ tags: true })
    })
  </script>
</datatype_new>

<datatypes>
  <virtual if={can_access}>
    <div class="uk-float-right">
      <a href="#datatypes/new" class="uk-button uk-button-small uk-button-default"><i class="fas fa-plus"></i> New datatype</a>
      <a if={ export } onclick="{ export_data }" class="uk-button uk-button-small uk-button-primary"><i class="fas fa-file-export"></i> Export CSV</a>
    </div>
    <h3>Listing datatypes</h3>

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
    this.perpage    = per_page
    this.locale     = window.localStorage.getItem('foxx-locale')
    this.data       = []
    this.export     = false
    this.can_access = false
    this.sortable   = false
    this.loaded     = false

    this.loadPage = function(pageIndex) {
      self.loaded = false
      common.get(url + "/cruds/datatypes/page/"+pageIndex+"/"+this.perpage, function(d) {
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
        common.get(url + "/cruds/datatypes/search/"+self.refs.term.value, function(d) {
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
      route("/datatypes/" + e.item.row._key + "/edit")
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
        common.delete(url + "/cruds/datatypes/" + e.item.row._key, function() {
          self.loadPage(self.page + 1)
        })
      }, function() {})
    }

    ////////////////////////////////////////////////////////////////////////////
    toggleField(e) {
      e.preventDefault()
      common.patch(url + "/cruds/datatypes/" + e.target.dataset.key + "/" + e.item.col.name + "/toggle", "{}", function(data) {
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
      common.get(url + '/cruds/datatypes/export', function(d) {
        var csvContent = d.data
        var encodedUri = encodeURI(csvContent)
        var link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "datatypes.csv")
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
              url + 'cruds/datatypes/orders/' + evt.oldIndex + "/" + evt.newIndex, {},
              function() {}
            )
          },
        });
      }
    })
  </script>
</datatypes>



<dataset_helper>
  <hr>
  <h4>Data definition sample</h4>
  <pre><code class="json">\{
    "model": [
      \{ "r": true, "c": "1-1", "n": "title", "t": "string", "j": "joi.string().required()", "l": "Title", "tr": true \},
      \{ "r": true, "c": "1-1", "n": "color", "t": "string:color", "j": "joi.string().required()", "l": "Pick a color"\},
      \{ "r": true, "c": "1-1", "n": "position", "t": "integer", "j": "joi.number().integer()", "l": "Position" \},
      \{ "r": true, "c": "1-1", "n": "online", "t": "boolean", "j": "joi.number().integer()", "l": "Online?" \},
      \{ "r": true, "c": "1-1", "n": "published_at", "t": "date", "j": "joi.date().format('YYYY-MM-DD').raw().required()", "l": "Published_at" \},
      \{ "r": true, "c": "1-1", "n": "time", "t": "time", "j": "joi.string()", "l": "Time" \},
      \{ "r": true, "c": "1-1", "n": "desc", "t": "text", "j": "joi.string()", "l": "Description" \},
      \{
        "r": true, "c": "1-1", "n": "author_key", "t": "list", "j": "joi.string()", "l": "User",
        "d": "d": "FOR doc IN datasets FILTER doc.type == 'authors' RETURN [doc._key, CONCAT(doc.ln, ' ', doc.fn)]"
      \},
      \{ "r": true, "c": "1-1", "n": "image", "t": "image", "j": "joi.string()", "l": "Pictures" \},
      \{ "r": true, "c": "1-1", "n": "file", "t": "file", "j": "joi.string()", "l": "Files" \},
      \{
        "r": true, "c": "1-1", "n": "tags", "t": "tags", "j": "joi.array()", "l": "Tags",
        "d": "LET tags = (FOR doc IN datasets FILTER doc.type=='books' AND doc.tags != NULL RETURN doc.tags) RETURN UNIQUE(FLATTEN(tags))"
      \},
      \{ "r": true, "c": "1-1", "n": "items", "t": "multilist", "j": "joi.array()", "l": "Multi List of tags", "d": "AQL request" \},
      \{ "r": true, "c": "1-1", "n": "position", "t": "map", "j": "joi.array()", "l": "Coordinates" \},
      \{ "r": true, "c": "1-1", "n": "html", "t": "code:html", "j": "joi.any()", "l": "Some HTML" \},
      \{ "r": true, "c": "1-1", "n": "scss", "t": "code:scss", "j": "joi.any()", "l": "Some SCSS" \},
      \{ "r": true, "c": "1-1", "n": "javascript", "t": "code:javascript", "j": "joi.any()", "l": "Some JS" \},
      \{ "r": true, "c": "1-1", "n": "json", "t": "code:json", "j": "joi.any()", "l": "Some Json" \},
      \{ "r": true, "c": "1-1", "n": "content", "t": "html", "j": "joi.any()", "l": "Content Editor" \}
    ],
    "columns": [
      \{ "name": "title", "tr": true, "class": "uk-text-right", "toggle": true,
        "values": \{ "true": "online", "false": "offline" \},
        "truncate": 20, "uppercase": true, "lowercase": true
      \}
    ],
    "act_as_tree": true,
    "revisions": 10,
    "slug": ["title"],
    "sort": "SORT doc.order ASC",
    "search": ["title", "barcode", "desc"],
    "includes": \{
      "conditions": "FOR c IN customers FILTER c._key == doc.customer_key",
      "merges": ", customer: c "
    \},
    "timestamps": true
  \}
  </code></pre>
  <style>
    dataset_helper pre { padding: 0; border: none; border-radius: 4px; }
  </style>
  <script>
    this.on('updated', function() {
      document.querySelectorAll('pre code').forEach(function(block) {
        hljs.highlightBlock(block);
      });
    })
  </script>
</dataset_helper>