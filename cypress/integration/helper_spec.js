
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

  it('Loads helper page', function () {
    cy.get('a[href="#helpers"]').click();
    cy.get('body').should('contain', 'Listing helpers')
    cy.get('div[data-is="helpers"]').should('contain', 'New helper')
  })

  it('Creates new helper', function () {
    cy.get('a[href="#helpers"]').click()
    cy.get('div[data-is="helpers"]').contains('New helper').click()
    cy.url().should('match', /static\/admin\/index.html#helpers\/new/)
    cy.get('#shortcut').type('testhelper');
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing helpers')
    cy.get('td').should('contain', 'testhelper')
  })

  it('Edits helper', function () {
    cy.get('a[href="#helpers"]').click()
    cy.contains('test').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#helpers\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing helper')
    cy.get('#shortcut').invoke('val').should('eq', 'testhelper')
    cy.get('#shortcut').clear();
    cy.get('#shortcut').type('testhelperedited');
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing helpers')
    cy.get('body').should('contain', 'testhelperedited')
  })

  it('deletes an helper', function () {
    cy.get('a[href="#helpers"]').click()
    cy.contains('testhelperedited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()
  
    cy.get('body').contains('testhelperedited').should('not.exist')
  })
})
