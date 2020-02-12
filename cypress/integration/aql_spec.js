
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

  it('Loads AQL page', function () {
    cy.get('a[href="#aqls"]').click();
    cy.get('body').should('contain', 'Listing aqls')
    cy.get('div[data-is="aqls"]').should('contain', 'New aql')
  })

  it('Creates new aql', function () {
    cy.get('a[href="#aqls"]').click()
    cy.get('div[data-is="aqls"]').contains('New aql').click()
    cy.url().should('match', /static\/admin\/index.html#aqls\/new/)
    cy.get('#slug').type('testaql');
    cy.get('#aql').then(elem => {
      elem.val('aql test function')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing aqls')
    cy.get('td').should('contain', 'testaql')
  })

  it('Edits AQL', function () {
    cy.get('a[href="#aqls"]').click()
    cy.contains('test').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#aqls\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing aql')
    cy.get('#slug').invoke('val').should('eq', 'testaql')
    cy.get('#slug').clear();
    cy.get('#slug').type('testaqledited');
    cy.get('#aql').then(elem => {
      elem.val('aql test function edited')
    })
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing aqls')
    cy.get('td').should('contain', 'testaqledited')
  })

  it('deletes an AQL', function () {
    cy.get('a[href="#aqls"]').click()
    cy.contains('testaqledited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()
  
    cy.get('td').contains('testaqledited').should('not.exist')
  })
})
