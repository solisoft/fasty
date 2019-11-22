
var host = 'http://demo.127.0.0.1.xip.io:8080/static/admin/'//'http://test.127.0.0.1.xip.io:8080'
describe('Core tests', function () {

  beforeEach(function () {
    // cy.visit(host + '/static/admin/index.html')
    cy.visit(host + 'login.html')
    cy.get('#username').type('demo@foxxy.ovh');
    cy.get('#password').type('977cebdd');
    cy.get('button').click();
    cy.visit(host + 'index.html')
    cy.url().should('eq', host + 'index.html#welcome')
  })

  it('Loads translation page', function () {
    cy.get('a[href="#trads"]').click();
    cy.get('body').should('contain', 'Listing trads')
    cy.get('div[data-is="trads"]').should('contain', 'New trad')
  })

  it('Creates new translation', function () {
    cy.get('a[href="#trads"]').click()
    cy.get('div[data-is="trads"]').contains('New trad').click()
    cy.url().should('match', /static\/admin\/index.html#trads\/new/)
    cy.get('#key').type('key1');
    cy.get('#value').type('translation');
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing trads')
    cy.get('td').should('contain', 'key1')
  })

  it('Edits a translation', function () {
    cy.get('a[href="#trads"]').click()
    cy.contains('key1').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#trads\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing trad')
    cy.get('#key').invoke('val').should('eq', 'key1')
    cy.get('#key').clear();
    cy.get('#key').type('key1_edit');
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing trads')
    cy.get('td').should('contain', 'key1_edit')
  })

  it('deletes a translation', function () {
    cy.get('a[href="#trads"]').click()
    cy.contains('key1_edit').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()
  
    cy.get('td').contains('key1_edit').should('not.exist')
  })
})
