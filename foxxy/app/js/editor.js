/* jshint asi: true */
(function ($) {

  $.fn.contentEditor = function (options) {

    var object_name = $(this).attr('data-name') || 'solicms'

    var self = this

    var settings = $.extend({
      widgets: [
        { id: 'h1', icon: 'fas fa-heading', title: 'h1' },
        { id: 'h2', icon: 'fas fa-heading', title: 'h2' },
        { id: 'h3', icon: 'fas fa-heading', title: 'h3' },
        { id: 'h4', icon: 'fas fa-heading', title: 'h4' },
        { id: 'h5', icon: 'fas fa-heading', title: 'h5' },
        { id: 'h6', icon: 'fas fa-heading', title: 'h6' },
        { id: 'col2', icon: 'fas fa-columns', title: '2' },
        { id: 'col3', icon: 'fas fa-columns', title: '3' },
        { id: 'col4', icon: 'fas fa-columns', title: '4' },
        { id: 'col363', icon: 'fas fa-columns', title: '3-6-3' },
        { id: 'col48', icon: 'fas fa-columns', title: '4-8' },
        { id: 'col84', icon: 'fas fa-columns', title: '8-4' },
        { id: 'text', icon: 'fas fa-align-left', title: 'text' },
        { id: 'img', icon: 'fas fa-image', title: 'img' },
        { id: 'slide', icon: 'fas fa-images', title: 'slide' },
        { id: 'code', icon: 'fas fa-code', title: 'code' },
        { id: 'video', icon: 'fas fa-video', title: 'video' },
        { id: 'html5', icon: 'fab fa-html5', title: 'html5' }
      ],
    }, options)

    var dragObj, activeObj, loopid = 0, editObj, ace_editor;

    var LSet = function (key, val) { window.localStorage.setItem(key, val) }
    var LGet = function (key) { return window.localStorage.getItem(key) }
    var LDel = function (key) { return window.localStorage.removeItem(key) }

    LDel('editor-history')

    var ipsum = function (nb) {
      var array = 'Chocolate lollipop pastry tiramisu. Chocolate cake sweet roll dragée. Cookie halvah tootsie roll cupcake candy canes pie oat cake danish chocolate cake. Cheesecake biscuit powder sweet powder. Chocolate bar lollipop jelly-o chocolate cake. Sweet roll sweet roll cupcake topping chocolate cake. Fruitcake chocolate cake jelly-o. Marzipan candy canes jujubes. Cotton candy candy canes icing sesame snaps chocolate cake toffee liquorice jelly-o. Pastry pastry bear claw toffee. Liquorice biscuit dessert chocolate bar gummies. Carrot cake danish cookie croissant toffee gingerbread sweet roll. Icing danish muffin cheesecake jelly-o sugar plum pastry cotton candy. Chocolate bar pie apple pie chocolate bar cupcake lollipop.'.split('.')
      var output = []
      for (var i = 0; i < nb; i++) {
        output.push(array[parseInt((Math.random() * 1000) % array.length)])
      }
      return output.join('. ') + '.'
    }

    var htmlEntities = function (str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    var get_widget_html = function (id, full) {
      var before
      var html
      var after

      loopid = loopid % 3

      switch (id) {
        case 'h1':
          before = '<div class="sg-row cms_row" data-type="h1"><div class="col-12 cms_col">'
          html = '<h1 data-type="h1" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h1>'
          after = '</div></div>'
          break;
        case 'h2':
          before = '<div class="sg-row cms_row" data-type="h2"><div class="col-12 cms_col">'
          html = '<h2 data-type="h2" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h2>'
          after = '</div></div>'
          break;
        case 'h3':
          before = '<div class="sg-row cms_row" data-type="h3"><div class="col-12 cms_col">'
          html = '<h3 data-type="h3" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h3>'
          after = '</div></div>'
          break;
        case 'h4':
          before = '<div class="sg-row cms_row" data-type="h4"><div class="col-12 cms_col">'
          html = '<h4 data-type="h4" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h4>'
          after = '</div></div>'
          break;
        case 'h5':
          before = '<div class="sg-row cms_row" data-type="h5"><div class="col-12 cms_col">'
          html = '<h5 data-type="h5" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h5>'
          after = '</div></div>'
          break;
        case 'h6':
          before = '<div class="sg-row cms_row" data-type="h6"><div class="col-12 cms_col">'
          html = '<h6 data-type="h6" class="drag drop" data-editable="true">Macaroon donut tiramisu sweet roll.</h6>'
          after = '</div></div>'
          break;
        case 'img':
          before = '<div class="sg-row cms_row" data-type="img"><div class="col-12 cms_col">'
          html = '<div data-type="img" class="drag drop" data-editable="true"><img src="https://via.placeholder.com/1200x600" alt=""></div>'
          after = '</div></div>'
          break;
        case 'text':
          before = '<div class="sg-row cms_row" data-type="text"><div class="col-12 cms_col">'
          html = '<div data-type="text" class="drag drop" data-editable="true"><p style="text-align: justify;">' + ipsum(5) + '</p></div>'
          after = '</div></div>'
          break;
        case 'code':
          var codes = []
          codes.push('<code class="language-html">' + htmlEntities('<h1>Some html code</h1>') + '</code>')
          codes.push('<code class="language-javascript">console.log("JS ... really ? ")</code>')
          codes.push('<code class="language-ruby">puts "I Love Ruby"</code>')
          before = '<div class="sg-row cms_row" data-type="code"><div class="col-12 cms_col">'
          html = '<div data-type="code" class="drag drop" data-editable="true"><pre>' + codes[loopid] + '</pre></div>'
          after = '</div></div>'
          break;
        case 'video':
          var ids = ['AWKEWqx8OyA', 'TmDKbUrSYxQ', 'X8zLJlU_-60']
          var data = '<div style="position:relative;padding-top:56.25%;"><iframe src="https://www.youtube.com/embed/' + ids[loopid] + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>'
          before = '<div class="sg-row cms_row" data-type="embed"><div class="col-12 cms_col">'
          html = '<div data-type="embed" class="drag drop" data-editable="true" data-html="' + data.replace(/"/g, "&quot;") + '">' + data + '</div>'
          after = '</div></div>'
          break
        case 'html5':
          before = '<div class="sg-row cms_row" data-type="embed"><div class="col-12 cms_col">'
          var data = '<p>HTML5 Code here</p>'
          html = '<div data-type="embed" class="drag drop" data-editable="true" data-html="' + data.replace(/"/g, "&quot;") + '">' + data + '</div>'
          after = '</div></div>'
          break
        case 'col2':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col2"><div class="col-6 cms_col"></div><div class="col-6 cms_col"></div></div>'
          after = ''
          break
        case 'col3':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col3"><div class="col-4 cms_col"></div><div class="col-4 cms_col"></div><div class="col-4 cms_col"></div></div>'
          after = ''
          break
        case 'col4':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col4"><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div><div class="col-3 cms_col"></div></div>'
          after = ''
          break
        case 'col282':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col282"><div class="col-2 cms_col"></div><div class="col-8 cms_col"></div><div class="col-2 cms_col"></div><div class="col-3 cms_col"></div></div>'
          after = ''
          break
        case 'col363':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col363"><div class="col-3 cms_col"></div><div class="col-6 cms_col"></div><div class="col-3 cms_col"></div></div></div>'
          after = ''
          break
        case 'col48':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col48"><div class="col-4 cms_col"></div><div class="col-8 cms_col"></div></div></div>'
          after = ''
          break
        case 'col84':
          before = ''
          html = '<div class="sg-row cms_row sub_row drag" data-type="col84"><div class="col-8 cms_col"></div><div class="col-4 cms_col"></div></div></div>'
          after = ''
          break
      }
      loopid++

      return full ? $(before + html + after) : $(html)
    }

    /*
      set_windows_events <function>
      Activate drag & drop events
    */
    var set_windows_events = function () {
      window.drag = function (event) {
        var el = $(event.target).hasClass('drag') ? $(event.target) : $(event.target).closest('.drag')
        el.addClass('dragging')
        event.stopPropagation();
        dragObj = el
        event.dataTransfer.setData('text', '');
        setTimeout(function () {
          add_drop_empty()
        }, 0)
      }

      window.drop = function (event) {
        event.stopPropagation()
        event.preventDefault()

        var el = $(event.target).hasClass('drop') ? $(event.target) : $(event.target).closest('.drop')

        if (event.dataTransfer.items) { // File drag & drop
          var isFile = false
          // Use DataTransferItemList interface to access the file(s)
          var count = event.dataTransfer.items.length
          if (count > 1) count = 1
          for (var i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
              isFile = true
              var file = event.dataTransfer.items[i].getAsFile();
              if (file.type.indexOf('image') >= 0) {
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = function () {
                  base64data = reader.result;

                  var formData = new FormData();
                  formData.append("files", file)
                  formData.append("key", localStorage.getItem('resize_api_key'))

                  $.ajax({
                    xhr: function () {
                      var xhr = new window.XMLHttpRequest();
                      //Upload progress
                      xhr.upload.addEventListener('progress', function (evt) {
                        if (evt.lengthComputable) {
                          var percentComplete = evt.loaded / evt.total;
                          //Do something with upload progress
                          $(el).html(parseInt(percentComplete * 100) + '%')
                        }
                      }, false);

                      return xhr;
                    },
                    type: 'POST',
                    url: '/file/upload',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (data) {
                      data = JSON.parse(data)
                      setTimeout(function () {
                        var picture = '<picture>'
                        picture += '<source media="(max-width: 480px)" srcset="/asset/r/' + data.filename + '/480.webp?_from='+ btoa(subdomain) +'" type="image/webp">'
                        picture += '<source media="(max-width: 480px)" srcset="/asset/r/' + data.filename + '/480?_from='+ btoa(subdomain) +'">'
                        picture += '<source media="(max-width: 799px)" srcset="/asset/r/' + data.filename + '/799.webp?_from='+ btoa(subdomain) +'" type="image/webp">'
                        picture += '<source media="(max-width: 799px)" srcset="/asset/r/' + data.filename + '/799?_from='+ btoa(subdomain) +'">'
                        picture += '<source media="(min-width: 800px)" srcset="/asset/o/' + data.filename + '.webp?_from='+ btoa(subdomain) +'" type="image/webp">'
                        picture += '<source media="(min-width: 800px)" srcset="/asset/o/' + data.filename + '?_from='+ btoa(subdomain) +'">'
                        picture += '<img src="/asset/o/' + data.filename + '">'
                        picture += '</picture>'
                        $(el).html(picture)
                      }, 100)
                      clear_empty_drags()
                    }
                  });
                }
              }
            }
          }

          if (!isFile) {
            $('.active').removeClass('active')
            if (dragObj.hasClass('cms_col')) {
              if (el.hasClass('cms_col')) {
                swap(dragObj, el)
              } else {
                swap(dragObj, el.children().length == 0 ? el : el.children().first())
              }
            } else {
              if (el.hasClass('cms_col')) {
                swap(dragObj.children().first(), el)
              } else {
                swap(dragObj, el)
              }
            }

            el.removeClass('drop_empty')
            if (!el.hasClass('drag')) {
              prepare_drag(el);
              prepare_drop(el)
            }
            $('.drop_empty').remove()
            clear_empty_drags()
            set_empty_rows()
          }
        }
      }

      window.drag_end = function (event) {
        event.stopPropagation()

        $('.row_editor').css('margin-left', (-99999) + 'px')
        $('.dragging').removeClass('dragging')
        $('.active').removeClass('active')
        $('.drop_empty').remove()
        clear_empty_drags()
      }

      window.allow_drop = function (event) {
        event.stopPropagation();
        event.preventDefault();
        var el = $(event.target).hasClass('drop') ? $(event.target) : $(event.target).closest('.drag')
        $('.active').removeClass('active')
        el.addClass('active')
      }
    }

    /*
      set_empty_rows <function>
      add Class .empty_row to all empty .cms_row
    */
    var set_empty_rows = function () {
      $(self).find('.cms_row').removeClass('empty_row')
      $(self).find('.cms_row').each(function (y, col) {
        if ($(col).text().trim() === '') {
          $(col).addClass('empty_row')
        }
      })
    }

    /*
      add_drop_empty <function>
      add drop DIVs when starting a drag
    */
    var add_drop_empty = function () {
      clear_empty_drags()
      var empty = '<div class="sg-row cms_row" data-type="full"><div class="col-12 cms_col"><div class="drop drop_empty row_empty"></div></div></div>'
      var drop_empty = '<div class="drop drop_empty col_empty"><div></div></div>'

      $(self).find('.edit-mode .cms_editor .sub_row .cms_col .drop').each(function (i, el) {
        if ($(el).parent().hasClass('cms_col') ||
          $(el).parent().hasClass('cms_row')) {
          $(el).after(drop_empty)
        }

      })

      $(self).find('.edit-mode .page-content > .cms_row').each(function (y, row) {
        $(row).before(empty)
      })
      $(self).find('.edit-mode .cms_col').each(function (y, col) {
        if (!$(col).hasClass('col-12')) $(col).prepend(drop_empty)
      })
      $(self).find('.edit-mode .cms_editor .page-content').append(empty)
      $(self).find('.edit-mode .drop_empty').attr('ondragover', 'allow_drop(event)')
      $(self).find('.edit-mode .drop_empty').attr('ondrop', 'drop(event)')
    }

    /*
      swap <function(from, to)>
      swap 2 widgets
    */
    var swap = function (from, to) {
      from = from[0]
      to = to[0]

      const afterTo = to.nextElementSibling
      const parent = to.parentNode

      if ($(from).data('menuitem')) {
        var html = get_widget_html($(from).data('menuitem'), false)

        if ($(to).hasClass('row_empty')) {
          var dest = $(html).hasClass('sub_row') ? $(parent).parent() : $(parent)
          dest.html(html[0].outerHTML)
        } else {
          if ($(to).hasClass('col_empty')) {
            $(to).html(html[0].outerHTML)
            $(to).removeClass("row_empty")
            $(to).removeClass("col_empty")
            $(to).addClass("drag")
          } else {
            if (!$(parent).hasClass('sg-container')) $(parent).html(html[0].outerHTML)
          }
        }

        prepare_drag($('.drag'));
        prepare_drop($('.drop'));

      } else {
        try {
          const tmp = from
          from.replaceWith(to)
          parent.insertBefore(from, afterTo)
        } catch (err) {
          parent.appendChild(tmp)
        }
        clear_empty_drags()
      }

      $(self).find('[data-type=full] .col-12').each(function(i, item) {
        if($(item).find('.sg-row').length > 0) {
          var html = $(item).html()
          $(item).parent()[0].outerHTML = html
        }
      })
    }

    /*
      prepare_drag <function(element)>
      set the element draggable
    */
    var prepare_drag = function (el) {
      el.attr('draggable', true)
      el.attr('ondragstart', 'drag(event)')
      el.attr('ondragend', 'drag_end(event)')
    }

    /*
      prepare_drop <function(element)>
      set the element dropable
    */
    var prepare_drop = function (el) {
      el.addClass('drop')
      el.attr('ondragover', 'allow_drop(event)')
      el.attr('ondrop', 'drop(event)')
    }

    /*
      clear_empty_drags <function>
      Remove empty drag elements
    */
    var clear_empty_drags = function () {
      $(self).find('.edit-mode .drop').each(function (i, el) {
        var from_col = $(el).parents()
          .map(function (i, el) {
            return el.className.split(' ')
          })
          .filter(function (i, el) {
            return el == 'cms_col'
          })
          .length >= 1

        if ($(el).find('.cms_col').length == 0 && !from_col &&
          $(el).text().trim() == '' && $(el).data('type') != 'img' && $(el).data('type') != 'embed') {
          $(el).remove()
        }
        if ($(el).hasClass('drop') && !$(el).hasClass('drag')) {
          $(el).remove()
        }
      })

      $(self).find('.edit-mode .drag').each(function (i, el) {
        var from_col = $(el).parents()
          .map(function (i, el) {
            return el.className.split(' ')
          })
          .filter(function (i, el) {
            return el == 'cms_col'
          })
          .length >= 1
        if (from_col && $(el).parent().find('.drag').length > 1 &&
          ($(el).html().trim() == '' || $(el).html().trim() == '<div></div>') &&
          !$(el).is('img')) {
          $(el).remove()
        }
      })

      $(self).find('.edit-mode .cms_row > *').each(function (i, el) {
        var from_col = $(el).parents()
          .map(function (i, el) {
            return el.className.split(' ')
          })
          .filter(function (i, el) {
            return el == 'cms_col'
          })
          .length >= 1

        if (!$(el).hasClass('cms_col') &&
          $(el).html().trim() == '' || $(el).html().trim() == '<div></div>') {
          $(el).remove()
        }
      })

      $(self).find('.edit-mode .cms_row').each(function (i, el) {
        if ($(el).html().trim() == '' ||
          $(el).html().trim() == '<div></div>' ||
          $(el).html().trim() == '<div class="col-12 cms_col"></div>') {
          $(el).remove()
        }
      })
    }

    /*
      run_export <function(base)>
      Export base element as json structure
    */
    var run_export = function (base) {
      var data = []
      $(base).find('> .cms_row').each(function (i, row) {

        if($(row).data('type') == 'full') {
          if($(row).find('div:first').hasClass('cms_col')) $(row).data('type', $(row).find("[data-type]").data('type'))
          else row = $(row).children()[0]
        }
        var data_row = { data: [], type: $(row).data('type') }

        $(row).find('> .cms_col').each(function (y, col) {
          var data_col = []
          $(col).find('[data-type]').each(function (z, widget) {
            if($(widget).data('exported') == undefined) {
              $(widget).data('exported', true)

              var data_widget = {}
              data_widget['type'] = $(widget).data('type')
              data_widget['attr'] = $(widget).data('attr')
              if ($(widget).data('type').indexOf('col') >= 0) {
                data_widget['content'] = run_export($(widget).parent())
              } else {
                data_widget['content'] = $(widget).data('html') || $(widget).html()
              }

              data_col.push(data_widget)
            }
          })

          data_row['data'].push(data_col)
        })

        data.push(data_row)
      })

      $(base).find('[data-exported]').removeAttr('data-exported')
      return data
    }

    /*
      set_content <function>
      Load HTML content into .page_content and run all useful methods for starting the editor
    */
    var set_content = function (value) {
      $(self).find('.page-content').html(value || '')

      clear_empty_drags();
      set_empty_rows()
      prepare_drag($(self).find(".drag"));
      prepare_drag($(self).find(".drop"))
      ;
      activate_events()
      remove_drag_attributes()

      $(self).find('[data-html]').each(function (i, el) { $(el).html($(el).data('html')) })
    }

    /*
      activate_events <function>
      Add jQuery events on page content
    */
    var activate_events = function () {
      // Set the active Row
      $(self).find('.edit-mode .cms_editor').on('mouseenter', '.cms_row', function () {
        $(self).find('.edit-mode .row_editor').css('margin-left', (-99999) + 'px')
        var y = (0 - $(self).find('.cms_editor').offset().top) + $(this).offset().top + $(this).height() - $(self).find('.row_editor').height()
        var x = $(this).offset().left + 16 - 100

        $(self).find('.edit-mode .row_editor').css('margin-left', x + 'px')
        $(self).find('.edit-mode .row_editor').css('margin-top', y + 'px')
        activeObj = $(this)
      })

      // Set the active Widget
      $(self).find('.edit-mode .cms_editor').on('mouseenter', '.cms_col > *', function () {
        var y = $(this).offset().top
        var x = $(this).offset().left - $(self).find('aside').width()
        activeObj = $(this)
      })

      // When you delete a row
      $(self).find('.edit-mode .cms_row_delete').on('click', function () {
        activeObj.closest('.edit-mode .sg-row').remove()
        return false
      })

      // When you click on a widget
      // It should open the editor modal with the right content / tools
      $(self).find('.edit-mode .page-content').on('click', '[data-type]', function () {
        editObj = $(this)
        raw_object = $(this.outerHTML)
        if (raw_object.data("attr")) {
          $(self).find("input[data-name=col-class]").val(raw_object.data("attr")['col-class'])
          $(self).find("input[data-name=row-class]").val(raw_object.data("attr")['row-class'])
          $(self).find("input[data-name=container-class]").val(raw_object.data("attr")['container-class'])
        } else {
          $(self).find("input[data-name=col-class]").val('')
          $(self).find("input[data-name=row-class]").val('')
          $(self).find("input[data-name=container-class]").val('')
        }
        $(self).find(".editor-code").hide()
        $(self).find(".editor-simplecode").hide()
        $(self).find(".editor-img-code").hide()
        if (raw_object.data('editable')) {
          $(self).find('.trumbowyg').hide()
          $(self).find('#ace-editor-' + object_name).hide()

          var html = $(this).html().trim()
          $(self).find('.edit-mode .cms_editor').addClass('editmode')
          if (raw_object.data('type') == 'text') {
            $('#trumbowyg-' + object_name).trumbowyg('html', html);
            $(self).find('.trumbowyg').show()
          }

          if (raw_object.data('type') == 'code') {
            $(self).find(".editor-code").show()
            $(self).find('#ace-editor-' + object_name).show()
            $(self).find("input[data-name=lang]").val(raw_object.find("code:first")[0].className.replace('language-', ''))
            ace_editor.session.setMode('ace/mode/' + mode);
            ace_editor.setOptions({ maxLines: Infinity, tabSize: 2, useSoftTabs: true });
            ace_editor.getSession().setValue($(this).text());
          }

          if (['embed', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(raw_object.data('type')) >= 0) {
            $(self).find(".editor-simplecode").show()
            $('#ace-editor-'+object_name).show()
            var mode = 'html'
            ace_editor.session.setMode('ace/mode/' + mode);
            ace_editor.setOptions({ maxLines: Infinity, tabSize: 2, useSoftTabs: true });
            var html = $(this).html()
            if (raw_object.data('type') == 'embed') html = $(this).attr('data-html').replace(/&quot;/g, '"')
            ace_editor.getSession().setValue(html);
          }

          if (['img'].indexOf(editObj.data('type')) >= 0) {
            var img_div = $(this).find('.img-div').length > 0 ? $(this).find('.img-div') : $(this).find('img').parent()
            $(self).find(".editor-simplecode").show()
            $(self).find(".editor-img-code").show()
            $('#ace-editor-'+object_name).show()
            $(self).find("input[data-name=img-width").val(img_div.attr('data-img-width'))
            $(self).find("select[data-name=img-alignment").val(img_div[0].style['text-align'])
            var mode = 'html'
            ace_editor.session.setMode('ace/mode/' + mode);
            ace_editor.setOptions({ maxLines: Infinity, tabSize: 2, useSoftTabs: true });
            ace_editor.getSession().setValue(img_div[0].innerHTML);
          }

        }

        return false
      })

      // Close the editor modal
      $(self).find('.edit-mode .sg-editcontent').on('click', '.fa-times-circle', function () {
        $('.edit-mode .cms_editor').removeClass('editmode')
        save_editor()

        return false
      })

      // When you click on the toolbar item
      $(self).find('.edit-mode .addwidget').on('click', function (e) {
        e.preventDefault();
        var html = get_widget_html($(this).data('id'), true)
        $(self).find('.edit-mode .page-content').append(html)
        $(self).find('.edit-mode .drag').attr('draggable', true)
        $(self).find('.edit-mode .drag').attr('ondragstart', 'drag(event)')
        $(self).find('.edit-mode .drag').attr('ondragover', 'allow_drop(event)')
        $(self).find('.edit-mode .drag').attr('ondrop', 'drop(event)')
        $(self).find('.edit-mode .drag').attr('ondragend', 'drag_end(event)')

        set_empty_rows()

        return false
      })

      $(self).find('.toggle-layout').on('click', function (e) {
        e.preventDefault()
        set_windows_events()
        $(self).find('.view-mode').toggleClass('isactive')
        $(self).find('.edit-mode').toggleClass('isactive')
        $(self).toggleClass('fullscreen')
        $('[data-exported]').removeAttr('data-exported')
        var data = {
          html: $(self).find('.edit-mode .page-content').html(),
          json: run_export($(self).find('.edit-mode .page-content'))
        }
        $('input[name="' + object_name + '"]').val(JSON.stringify(data))
        $(self).find('.page-content').html(data['html'] || '')
        remove_drag_attributes()
        $(self).find('[data-html]').each(function (i, el) {
          $(el).html($(el).attr('data-html'))
        })

        return false
      })
    }

    /*
      remove_drag_attributes <function(element)>
    */
    var remove_drag_attributes = function () {
      $(self).find('.view-mode .drag, .view-mode .drop').removeAttr('ondragend')
        .removeAttr('ondragstart')
        .removeAttr('ondragover')
        .removeAttr('ondrop')
    }


    var view_mode = '<a href="" class="toggle-layout view-mode isactive">Edit content</a>'
    view_mode += '<section class="view-mode isactive">\
                        <div class="page-content"></div></section>'

    $(self).append(view_mode)

    var items = '<aside class="edit-mode">\
                   <div class="sg-container toolbox"><h1>Page tools</h1> \
                   <div class="sg-row"></div>\
                   <div class="sg-row"><a href="" class="toggle-layout">Exit</a></div></div>\
                  </aside>'

    $(self).append(items)
    $(self).addClass('editor-cms')

    settings.widgets.forEach(function (w) {
      $(self).find(".toolbox .sg-row:first").append('\
      <div class="col-4 drag" dragdraggable="true" data-menuitem="' + w.id + '">\
        <a href="#" class="addwidget" data-id="' + w.id + '">\
          <i class="' + w.icon + '"></i>\
          <div class="small">' + w.title + '</div></a>\
      </div>')
    })

    var content = '<section class="edit-mode">\
      <div class="cms_editor">\
        <div class="row_editor">\
          <div class="cms_toolbar">\
            <ul>\
              <li><a href="#" class="cms_row_delete"><i class="fas fa-trash-alt"></i></a></li>\
            </ul>\
          </div>\
        </div>\
        <div class="sg-container page-content"></div>\
        <div class="sg-editcontent">\
          <i class="far fa-times-circle" style="float: right;padding: 10px"></i>\
          <div class="content">\
            <div id="trumbowyg-'+object_name+'"></div>\
            <div><label>Container Class</label><input type="text" data-name="container-class" class="uk-input"></div>\
            <div><label>Row Class</label><input type="text" data-name="row-class" class="uk-input"></div>\
            <div><label>Col Class</label><input type="text" data-name="col-class" class="uk-input"></div>\
            <div class="editor-code"><label>Language</label><input type="text" data-name="lang" class="uk-input"></div>\
            <div class="uk-grid"><div class="uk-width-1-2 editor-img-code"><label>Image Width</label><input type="text" data-name="img-width" class="uk-input"></div>\
            <div class="uk-width-1-2 editor-img-code"><label>Image Alignment</label>\
            <select class="uk-select" data-name="img-alignment">\
            <option>left</option><option>center</option><option>right</option></select></div></div>\
            <div class="editor-code editor-simplecode"><label>Code</label><div id="ace-editor-'+object_name+'" class="ace-editor"></div></div>\
          </div>\
        </div>\
      </div>\
    </section>'

    $(self).append(content)
    set_content(options.value)

    $('#trumbowyg-'+object_name).trumbowyg({
      btns: [
        ['viewHTML'],
        ['undo', 'redo'],
        ['formatting'],
        ['strong', 'em', 'del'],
        ['superscript', 'subscript'],
        ['link'],
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
        ['unorderedList', 'orderedList'],
        ['horizontalRule'],
        ['removeformat'],
        ['fullscreen']
      ],
      resetCss: true,
      svgPath: 'img/icons.svg',
      removeformatPasted: true
    }).on('tbwchange', function () {
      editObj.html($('#trumbowyg-' + object_name).trumbowyg('html'))
    });

    // Activate Ace editor
    ace_editor = ace.edit('ace-editor-'+object_name)
    ace_editor.getSession().setUseWrapMode(true)

    ace_editor.setTheme('ace/theme/twilight')
    ace_editor.session.setMode('ace/mode/html')

    var save_editor = function () {
      if (editObj) {
        var attributes = {
          'col-class': $('input[data-name=col-class]').val(),
          'row-class': $('input[data-name=row-class]').val(),
          'container-class': $('input[data-name=container-class]').val()
        }
        var content = ace_editor.getSession().getValue()
        if (editObj.data('type') == 'code') {
          var mode = 'language-' + $(self).find("input[data-name=lang]").val()
          editObj.html('<pre><code class="' + mode + '">' + htmlEntities(content) + '</code></pre>')
        }
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(editObj.data('type')) >= 0) {
          editObj.html(content)
        }
        if (['embed'].indexOf(editObj.data('type')) >= 0) {
          editObj.html(content)
          editObj.attr('data-html', content)
        }
        if (['text'].indexOf(editObj.data('type')) >= 0) {
          editObj.html($('#trumbowyg-'+object_name).trumbowyg('html'))
        }
        if(['img'].indexOf(editObj.data('type')) >= 0) {
          var width = $(self).find("input[data-name=img-width").val() ? $(self).find("input[data-name=img-width").val() : '100%'
          var alignment = $(self).find("select[data-name=img-alignment").val() ? $(self).find("select[data-name=img-alignment").val() : 'left'
          var temp = $('<div>').append($.parseHTML(content))
          temp.each(function() {
            var img = $(this).find('img')
            for(var i = 0; i < img.length; i++) {
              img[i].style.width = width
            }
          })
          editObj.html('<div class="img-div" style="text-align: ' + alignment + '" data-img-width="' + width + '">' + temp[0].innerHTML + '</div>')
        }
        editObj.attr('data-attr', JSON.stringify(attributes))

      }
    }

    return this;
  };

})(jQuery);