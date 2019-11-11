
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

  it('Loads layouts page', function () {
    cy.get('a[href="#layouts"]').click();
    cy.get('body').should('contain', 'Listing layouts')
    cy.get('div[data-is="layouts"]').should('contain', 'New layout')
  })

  it('Creates new layout', function () {
    cy.get('a[href="#layouts"]').click()
    cy.get('div[data-is="layouts"]').contains('New layout').click()
    cy.url().should('match', /static\/admin\/index.html#layouts\/new/)
    cy.get('#name').type('test layout');
    cy.get('#html').then(elem => {
      elem.val('<html>sample test layout</html>')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing layouts')
    cy.get('td').should('contain', 'test layout')
  })

  it('Edits a layout', function () {
    cy.get('a[href="#layouts"]').click()
    cy.contains('test layout').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#layouts\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing layout')
    cy.get('#name').invoke('val').should('eq', 'test layout')
    cy.get('#name').clear();
    cy.get('#name').type('test layout edited');
    cy.get('#html').then(elem => {
      elem.val('<html>sample test layout edited</html>')
    })
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing layouts')
    cy.get('td').should('contain', 'test layout edited')
  })

  it('deletes a layout', function () {
    cy.get('a[href="#layouts"]').click()
    cy.contains('test layout edited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()
  
    cy.get('td').contains('test layout edited').should('not.exist')
  })
})
