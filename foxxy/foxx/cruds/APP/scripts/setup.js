'use strict';
const db = require('@arangodb').db;
var Graph = require('@arangodb/general-graph');

function create_collection(collection) {
  if (!db._collection(collection)) {
    db._createDocumentCollection(collection);
    if(collection == 'layouts') {
      db._collection(collection).save({
        "html": "<!DOCTYPE html>\r\n<html>\r\n  <head lang=\"{{ lang }}\">\r\n    <meta charset=\"utf-8\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\r\n    @headers\r\n    <link rel=\"stylesheet\" href=\"@css\">\r\n    \r\n  </head>\r\n  <body>\r\n    \r\n    {{ partial | nav }}\r\n    \r\n    <section class=\"section\">\r\n      <div class=\"container\">\r\n        @yield\r\n      </div>\r\n    </section>\r\n    \r\n    {{ partial | footer }}\r\n    <script src='@js'></script> \r\n  </body>\r\n</html>",
        "javascript": "",
        "name": "home",
        "scss": "p { margin-bottom: 20px; }\r\n\r\ndd { margin-bottom: 10px; }\r\ndt { font-weight: bold; }",
        "i_js": "{{ external | https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.6/highlight.min.js }}\r\n{{ external | https://cdnjs.cloudflare.com/ajax/libs/riot/3.13.2/riot+compiler.min.js }}\r\n",
        "i_css": "{{ external | https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css }}\r\n{{ external | https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.6/styles/railscasts.min.css }}"
      })
    }

    if(collection == 'pages') {
      var layout = db._collection('layouts').firstExample({})
      db._collection(collection).save({
        "slug": {
          "en": "home",
          "fr": "home"
        },
        "og_aql": {
          "en": "",
          "fr": ""
        },
        "og_img": {
          "en": "",
          "fr": ""
        },
        "og_title": {
          "en": "Home Page",
          "fr": "Page d'accueil"
        },
        "description": {
          "en": "",
          "fr": ""
        },
        "html": {
          "en": {
            "html": "<div class=\"sg-row cms_row\" data-type=\"h1\"><div class=\"col-12 cms_col\"><h1 data-type=\"h1\" class=\"drag drop\" data-editable=\"true\" draggable=\"true\" ondragstart=\"drag(event)\" ondragover=\"allow_drop(event)\" ondrop=\"drop(event)\" ondragend=\"drag_end(event)\">Macaroon donut tiramisu sweet roll.</h1></div></div><div class=\"sg-row cms_row\" data-type=\"text\"><div class=\"col-12 cms_col\"><div data-type=\"text\" class=\"drag drop\" data-editable=\"true\" draggable=\"true\" ondragstart=\"drag(event)\" ondragover=\"allow_drop(event)\" ondrop=\"drop(event)\" ondragend=\"drag_end(event)\"><p style=\"text-align: justify;\"> Icing danish muffin cheesecake jelly-o sugar plum pastry cotton candy.  Liquorice biscuit dessert chocolate bar gummies. .  Carrot cake danish cookie croissant toffee gingerbread sweet roll. .</p></div></div></div><div class=\"sg-row cms_row empty_row\" data-type=\"img\"><div class=\"col-12 cms_col\"><div data-type=\"img\" class=\"drag drop\" data-editable=\"true\" draggable=\"true\" ondragstart=\"drag(event)\" ondragover=\"allow_drop(event)\" ondrop=\"drop(event)\" ondragend=\"drag_end(event)\"><img src=\"https://via.placeholder.com/1200x600\" alt=\"\"></div></div></div>",
            "json": [
              {
                "data": [
                  [
                    {
                      "type": "h1",
                      "content": "Macaroon donut tiramisu sweet roll."
                    }
                  ]
                ],
                "type": "h1"
              },
              {
                "data": [
                  [
                    {
                      "type": "text",
                      "content": "<p style=\"text-align: justify;\"> Icing danish muffin cheesecake jelly-o sugar plum pastry cotton candy.  Liquorice biscuit dessert chocolate bar gummies. .  Carrot cake danish cookie croissant toffee gingerbread sweet roll. .</p>"
                    }
                  ]
                ],
                "type": "text"
              },
              {
                "data": [
                  [
                    {
                      "type": "img",
                      "content": "<img src=\"https://via.placeholder.com/1200x600\" alt=\"\">"
                    }
                  ]
                ],
                "type": "img"
              }
            ]
          },
          "fr": {
            "html": "<div class=\"sg-row cms_row\" data-type=\"h1\"><div class=\"col-12 cms_col\"><h1 data-type=\"h1\" class=\"drag drop\" data-editable=\"true\" draggable=\"true\" ondragstart=\"drag(event)\" ondragover=\"allow_drop(event)\" ondrop=\"drop(event)\" ondragend=\"drag_end(event)\">Macaroon donut tiramisu sweet roll.</h1></div></div><div class=\"sg-row cms_row\" data-type=\"text\"><div class=\"col-12 cms_col\"><div data-type=\"text\" class=\"drag drop\" data-editable=\"true\" draggable=\"true\" ondragstart=\"drag(event)\" ondragover=\"allow_drop(event)\" ondrop=\"drop(event)\" ondragend=\"drag_end(event)\"><p style=\"text-align: justify;\"> Chocolate bar lollipop jelly-o chocolate cake.  Cheesecake biscuit powder sweet powder.  Icing danish muffin cheesecake jelly-o sugar plum pastry cotton candy.  Sweet roll sweet roll cupcake topping chocolate cake.  Chocolate cake sweet roll dragée.</p></div></div></div><div class=\"sg-row cms_row empty_row\" data-type=\"img\"><div class=\"col-12 cms_col\"><div data-type=\"img\" class=\"drag drop\" data-editable=\"true\" draggable=\"true\" ondragstart=\"drag(event)\" ondragover=\"allow_drop(event)\" ondrop=\"drop(event)\" ondragend=\"drag_end(event)\"><img src=\"https://via.placeholder.com/1200x600\" alt=\"\"></div></div></div>",
            "json": [
              {
                "data": [
                  [
                    {
                      "type": "h1",
                      "content": "Macaroon donut tiramisu sweet roll."
                    }
                  ]
                ],
                "type": "h1"
              },
              {
                "data": [
                  [
                    {
                      "type": "text",
                      "content": "<p style=\"text-align: justify;\"> Chocolate bar lollipop jelly-o chocolate cake.  Cheesecake biscuit powder sweet powder.  Icing danish muffin cheesecake jelly-o sugar plum pastry cotton candy.  Sweet roll sweet roll cupcake topping chocolate cake.  Chocolate cake sweet roll dragée.</p>"
                    }
                  ]
                ],
                "type": "text"
              },
              {
                "data": [
                  [
                    {
                      "type": "img",
                      "content": "<img src=\"https://via.placeholder.com/1200x600\" alt=\"\">"
                    }
                  ]
                ],
                "type": "img"
              }
            ]
          }
        },
        "og_url": {
          "en": "",
          "fr": ""
        },
        "name": {
          "en": "Home page",
          "fr": "Home page"
        },
        "online": true,
        "published_at": "2019-03-15",
        "layout_id": "layouts/173624",
        "og_type": {
          "en": "",
          "fr": ""
        }
      })
    }

    if(collection == 'partials') {
      var layout = db._collection('layouts').firstExample({})
      db._collection(collection).save({
        "name": "Footer",
        "slug": "footer",
        "layout_id": layout._id,
        "html": "<footer class=\"footer\">\r\n  <div class=\"content has-text-centered\">\r\n    <p>\r\n      {{ tr | done_by }} <a href=\"http://olivier.best\">{{ tr | me }}</a><br>\r\n      {{ tr | copyright }} {{ tr | propulsed_by }} {{ tr | love }}\r\n    </p>\r\n  </div>\r\n</footer>"
      })

      db._collection(collection).save({
        "name": "Navigation",
        "slug": "nav",
        "layout_id": layout._id,
        "html": "<nav class=\"navbar\" role=\"navigation\" aria-label=\"main navigation\">\r\n  <div class=\"navbar-brand\">\r\n    <a class=\"navbar-item\" href=\"/{{ lang }}/-/home\">\r\n      <img src=\"https://www.svgrepo.com/show/270823/lightning-thunder.svg\" width=\"112\" height=\"28\"> Fasty\r\n    </a>\r\n\r\n    <a role=\"button\" class=\"navbar-burger burger\" aria-label=\"menu\" aria-expanded=\"false\" data-target=\"navbarBasicExample\">\r\n      <span aria-hidden=\"true\"></span>\r\n      <span aria-hidden=\"true\"></span>\r\n      <span aria-hidden=\"true\"></span>\r\n    </a>\r\n  </div>\r\n\r\n  <div id=\"navbarBasicExample\" class=\"navbar-menu\">\r\n    <div class=\"navbar-start\">\r\n      \r\n      <a class=\"navbar-item\" href=\"http://fasty.ovh\">\r\n        Link\r\n      </a>\r\n\r\n    </div>\r\n\r\n    <div class=\"navbar-end\">\r\n      <div class=\"navbar-item\">\r\n        <div class=\"buttons\">\r\n          <a class=\"button\" href=\"/fr\">\r\n            FR\r\n          </a>\r\n          <a class=\"button\" href=\"/en\">\r\n            EN\r\n          </a>\r\n        </div>\r\n      </div>\r\n      \r\n    </div>\r\n  </div>\r\n</nav>"
      })

      db._collection(collection).save({
        "name": "Page",
        "slug": "page",
        "layout_id": layout._id,
        "html": "<%\r\n\r\nfunction check_content(data) \r\n  if type(data.content) == \"table\" then\r\n    data = data.content\r\n  else\r\n    data = { data }\r\n  end\r\n  \r\n  return data\r\nend\r\n\r\nfunction render_bulma(data)\r\n  \r\n  out = '' --  to_json(data)\r\n  for k, widget in pairs(data) do\r\n    local content = ''\r\n    local data_o = {}\r\n    \r\n    if widget.data  then\r\n      content = widget.data[1][1].content\r\n      data_o = widget.data\r\n    else\r\n      content = widget.content\r\n      data_o = widget.content\r\n    end\r\n    \r\n    \r\n    -- out = out .. '<div>' .. widget.type  .. '</div>'\r\n    \r\n    if widget.type == 'h1' then\r\n       out = out .. \"<\" .. widget.type .. \" class='title is-1'>\" .. content .. \"</\" .. widget.type .. \">\"\r\n    end\r\n    if widget.type == 'h2' then\r\n       out = out .. \"<\" .. widget.type .. \" class='title is-2'>\" .. content .. \"</\" .. widget.type .. \">\"\r\n    end\r\n    if widget.type == 'h3' then\r\n       out = out .. \"<\" .. widget.type .. \" class='title is-3'>\" .. content .. \"</\" .. widget.type .. \">\"\r\n    end\r\n    if widget.type == 'h4' then\r\n       out = out .. \"<\" .. widget.type .. \" class='title is-4'>\" .. content .. \"</\" .. widget.type .. \">\"\r\n    end\r\n    if widget.type == 'h5' then\r\n       out = out .. \"<\" .. widget.type .. \" class='title is-5'>\" .. content .. \"</\" .. widget.type .. \">\"\r\n    end\r\n    if widget.type == 'h6' then\r\n       out = out .. \"<\" .. widget.type .. \" class='title is-6'>\" .. content .. \"</\" .. widget.type .. \">\"\r\n    end\r\n    \r\n    if widget.type == 'text' then\r\n       out = out .. \"<p>\" .. content .. \"</p>\"\r\n    end\r\n    \r\n    if widget.type == 'img' or widget.type == 'code'  or widget.type == 'embed'  then\r\n      out = out .. content\r\n    end\r\n    \r\n    if widget.type == 'col48' then\r\n      out = out .. '<div class=\"columns\">'\r\n      out = out .. '<div class=\"column is-one-third\">'\r\n      for k, sub_row in pairs(widget.data[1]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[2]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '</div>'\r\n    end\r\n    \r\n    if widget.type == 'col84' then\r\n      out = out .. '<div class=\"columns\">'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[1]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '<div class=\"column is-one-third\">'\r\n      for k, sub_row in pairs(widget.data[2]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '</div>'\r\n    end\r\n    \r\n    if widget.type == 'col363' then\r\n      out = out .. '<div class=\"columns\">'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[1]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '<div class=\"column is-one-half\">'\r\n      for k, sub_row in pairs(widget.data[2]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[3]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '</div>'\r\n    end\r\n    \r\n    \r\n    if widget.type == 'col2' then\r\n      out = out .. '<div class=\"columns\">'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[1]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[2]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '</div>'\r\n    end\r\n    \r\n    if widget.type == 'col3' then\r\n      out = out .. '<div class=\"columns\">'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[1]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[2]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      \r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[3]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '</div>'\r\n    end\r\n    \r\n    if widget.type == 'col4' then\r\n      out = out .. '<div class=\"columns\">'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[1]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[2]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      \r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[3]) do\r\n        sub_row = check_content(sub_row)\r\n         \r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '<div class=\"column\">'\r\n      for k, sub_row in pairs(widget.data[4]) do\r\n        sub_row = check_content(sub_row)\r\n        out = out ..  render_bulma(sub_row)\r\n      end\r\n      out = out .. '</div>'\r\n      out = out .. '</div>'\r\n    end\r\n    \r\n    \r\n  end\r\n\r\n  return out\r\nend\r\n\r\n\r\n%>\r\n\r\n<%- render_bulma(dataset) %>\r\n",
        "search": {
          "en": "Page"
        }
      })
    }

  }
  db._collection(collection).ensureIndex({
    type: 'fulltext',
    fields: ['search.en']
  });

}

create_collection('layouts');

create_collection('pages');

create_collection('partials');

create_collection('components');

create_collection('spas');

create_collection('redirections');

create_collection('trads');

create_collection('datatypes');

create_collection('users');

create_collection('users');

create_collection('users');

create_collection('users');

create_collection('aqls');

create_collection('aqls');

create_collection('helpers');

create_collection('helpers');

create_collection('apis');
create_collection('api_routes');
create_collection('api_scripts');
create_collection('api_tests');

create_collection('folders');

var create_edge_collection = function (collection) {
  if (!db._collection(collection)) {
    db._createEdgeCollection(collection);
  }
}

var create_graph = function (graphName) {
  if (!Graph._exists(graphName)) {
    Graph._create(graphName,
      [Graph._relation('folder_path', 'folders', 'folders')]
    );
  }
}

create_edge_collection('folder_path')
create_graph('folderGraph')
/*@{{setup}}*/

