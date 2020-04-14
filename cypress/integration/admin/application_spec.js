
var host = 'http://test.127.0.0.1.xip.io:8080/static/admin/'
describe('Applications', function () {

  beforeEach(function () {
    cy.login()
  })

  it('applications page', function () {
    cy.get('a[href="#spas"]').click();
    cy.get('body').should('contain', 'Listing spas')
    cy.get('div[data-is="spas"]').should('contain', 'New spa')
  })

  it('Creates new application', function () {
    cy.get('a[href="#spas"]').click()
    cy.get('div[data-is="spas"]').contains('New spa').click()
    cy.url().should('match', /static\/admin\/index.html#spas\/new/)
    cy.get('#name').type('test application');
    cy.get('#html').then(elem => {
      elem.val('<html>sample test application</html>')
    })
    cy.get('#js').then(elem => {
      elem.val('router js')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing spas')
    cy.get('td').should('contain', 'test application')
  })

  it('Edits an application', function () {
    cy.get('a[href="#spas"]').click()
    cy.contains('test application').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#spas\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing spa')
    cy.get('#name').invoke('val').should('eq', 'test application')
    cy.get('#name').clear();
    cy.get('#name').type('test application edited');
    cy.get('#html').then(elem => {
      elem.val('<html>sample test application edited</html>')
    })
    cy.get('#js').then(elem => {
      elem.val('edited router js')
    })
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing spas')
    cy.get('td').should('contain', 'test application edited')
  })

  it('deletes an application', function () {
    cy.get('a[href="#spas"]').click()
    cy.contains('test application edited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()

    cy.get('body').contains('test application edited').should('not.exist')
  })
})
