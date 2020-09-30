var app = {
  'css': `todo,[is="todo"]{ padding: 16px; }`,

  'exports': {
    state: {
      items: []
    },

    add(e) {
      e.preventDefault();
      const input = e.target.todo;

      this.state.items.push(input.value);
      this.update();

      input.value = '';
    }
  },

  'template': function(template, expressionTypes, bindingTypes, getComponent) {
    return template(
      '<h1 expr0="expr0"> </h1><ul><li expr1="expr1"></li></ul><form expr2="expr2"><input name="todo"/><button expr3="expr3"> </button></form>',
      [{
        'redundantAttribute': 'expr0',
        'selector': '[expr0]',

        'expressions': [{
          'type': expressionTypes.TEXT,
          'childNodeIndex': 0,

          'evaluate': function(scope) {
            return scope.props.title;
          }
        }]
      }, {
        'type': bindingTypes.EACH,
        'getKey': null,
        'condition': null,

        'template': template(' ', [{
          'expressions': [{
            'type': expressionTypes.TEXT,
            'childNodeIndex': 0,

            'evaluate': function(scope) {
              return scope.item;
            }
          }]
        }]),

        'redundantAttribute': 'expr1',
        'selector': '[expr1]',
        'itemName': 'item',
        'indexName': null,

        'evaluate': function(scope) {
          return scope.state.items;
        }
      }, {
        'redundantAttribute': 'expr2',
        'selector': '[expr2]',

        'expressions': [{
          'type': expressionTypes.EVENT,
          'name': 'onsubmit',

          'evaluate': function(scope) {
            return scope.add;
          }
        }]
      }, {
        'redundantAttribute': 'expr3',
        'selector': '[expr3]',

        'expressions': [{
          'type': expressionTypes.TEXT,
          'childNodeIndex': 0,

          'evaluate': function(scope) {
            return ['Add #', scope.state.items.length + 1].join('');
          }
        }]
      }]
    );
  },

  'name': 'todo'
};

export default app;
