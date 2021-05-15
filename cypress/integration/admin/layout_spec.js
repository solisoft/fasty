
var host = 'http://test.127.0.0.1.nip.io:8080/static/admin/'
describe('Layouts', function () {

  beforeEach(function () {
    cy.login()
  })

  it('Loads layouts page', function () {
    cy.get('a[href="#datasets/layouts"]').click();
    cy.get('body').should('contain', 'Listing layouts')
    cy.get('body').should('contain', 'New layout')
  })

  it('Creates new layout', function () {
    cy.get('a[href="#datasets/layouts"]').click()
    cy.get('body').contains('New layout').click()
    cy.url().should('match', /static\/admin\/index.html#datasets\/layouts\/new/)
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
    cy.get('a[href="#datasets/layouts"]').click()
    cy.contains('test layout').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#datasets\/layouts\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing layout')
    cy.get('#name').invoke('val').should('eq', 'test layout')
    cy.get('#name').clear();
    cy.get('#name').type('test layout edited');
    cy.get('#html').then(elem => {
      elem.val('<html>sample test layout edited</html>')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing layouts')
    cy.get('td').should('contain', 'test layout edited')
  })

  it('deletes a layout', function () {
    cy.get('a[href="#datasets/layouts"]').click()
    cy.contains('test layout edited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()

    cy.get('body').contains('test layout edited').should('not.exist')
  })
})
