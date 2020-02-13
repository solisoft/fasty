
var host = 'http://test.127.0.0.1.xip.io:8080/static/admin/'
describe('Core tests', function () {

  beforeEach(function () {
    cy.visit(host + 'login.html')
    cy.get('#username').type('demo@foxxy.ovh');
    cy.get('#password').type('977cebdd');
    cy.get('button').click();
    cy.visit(host + 'index.html')
    cy.url().should('eq', host + 'index.html#welcome')
  })

  it('Loads datatypes page', function () {
    cy.get('a[href="#datatypes"]').click();
    cy.get('body').should('contain', 'Listing datatypes')
    cy.get('div[data-is="datatypes"]').should('contain', ' New datatype')
  })

  it('Creates new datatype', function () {
    cy.get('a[href="#datatypes"]').click()
    cy.get('div[data-is="datatypes"]').contains(' New datatype').click()
    cy.url().should('match', /static\/admin\/index.html#datatypes\/new/)
    cy.get('#name').type('Mailing');
    cy.get('#slug').type('mailing');
    cy.get('#javascript').then(elem => {
      elem.val('{' +
      '\n"model": [' +
      '\n    { "r": true, "c": "1-1", "n": "title", "t": "string", "j": "joi.string().required()", "l": "Title"},' +
    '\n      { "r": true, "c": "1-1", "n": "html", "t": "code:html", "j": "joi.string().required()", "l": "HTML" },' +
    '\n      { "r": true, "c": "1-1", "n": "text", "t": "code:html", "j": "joi.string().required()", "l": "Text" }' +
    '\n  ],' +
    '\n  "columns": [{ "name": "title" }]' +
    '\n}')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing datatypes')
    cy.get('td').should('contain', 'Mailing')
  })

  it('Edits a datatype', function () {
    cy.get('a[href="#datatypes"]').click()
    cy.get('table').contains('Mailing').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#datatypes\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing datatype')
    cy.get('#slug').invoke('val').should('eq', 'mailing')
    cy.get('#slug').clear();
    cy.get('#slug').type('mailing-edited');
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing datatypes')
    cy.get('td').should('contain', 'mailing-edited')
  })

  // start check new datatype
  it('Loads Mailing page', function () {
    cy.get('a[href="#datasets/mailing-edited"]').click();
    cy.get('body').should('contain', 'Listing mailing-edited')
  })

  it('Creates new mailing', function () {
    cy.get('a[href="#datasets/mailing-edited"]').click()
    cy.get('a[href="#datasets/mailing-edited/new"]').click();
    cy.url().should('match', /static\/admin\/index.html#datasets\/mailing-edited\/new/)
    cy.get('#title').type('mail 1');
    cy.get('#html').then(elem => {
      elem.val('<p>this is mail 1</p>')
    })
    cy.get('#text').then(elem => {
      elem.val('this is mail 1')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing mailing-edited')
    cy.get('td').should('contain', 'mail 1')
  })

  it('Edits a mailing', function () {
    cy.get('a[href="#datasets/mailing-edited"]').click()
    cy.get('table').contains('mail 1').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#datasets\/mailing-edited\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing mailing-edited')
    cy.get('#title').invoke('val').should('eq', 'mail 1')
    cy.get('#title').clear();
    cy.get('#title').type('mail 1 edited');
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing mailing-edited')
    cy.get('td').should('contain', 'mail 1 edited')
  })

  it('Deletes a mailing', function() {
    cy.get('a[href="#datasets/mailing-edited"]').click()
    cy.get('table').contains('mail 1 edited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()
    cy.get('body').contains('mail 1 edited').should('not.exist')
  })
  // end

  it('deletes a datatype', function () {
    cy.get('a[href="#datatypes"]').click()
    cy.contains('mailing-edited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()

    cy.get('body').contains('mailing-edited').should('not.exist')
  })
})
