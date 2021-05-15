
var host = 'http://test.127.0.0.1.nip.io:8080/static/admin/'
describe('Partials', function () {

  beforeEach(function () {
    cy.login()
  })

  it('Loads partials page', function () {
    cy.get('a[href="#datasets/partials"]').click();
    cy.get('body').should('contain', 'Listing partials')
    cy.get('body').should('contain', 'New partial')
  })

  it('Creates new partial', function () {
    cy.get('a[href="#datasets/partials"]').click()
    cy.get('body').contains('New partial').click()
    cy.url().should('match', /static\/admin\/index.html#datasets\/partials\/new\/\d+/)
    cy.get('#name').type('test partial');
    cy.get('#slug').type('testpartial');
    cy.get('#html').then(elem => {
      elem.val('<html>sample test partial</html>')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing partials')
    cy.get('td').should('contain', 'test partial')
  })

  it('Edits a partial', function () {
    cy.get('a[href="#datasets/partials"]').click()
    cy.contains('test partial').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#datasets\/partials\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing partial')
    cy.get('#name').invoke('val').should('eq', 'test partial')
    cy.get('#name').clear();
    cy.get('#name').type('test partial edited');
    cy.get('#slug').invoke('val').should('eq', 'testpartial')
    cy.get('#slug').clear();
    cy.get('#slug').type('tpedited');
    cy.get('#html').then(elem => {
      elem.val('<html>sample test partial edited</html>')
    })
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing partials')
    cy.get('td').should('contain', 'test partial edited')
  })

  it('deletes a partial', function () {
    cy.delete_partial('test partial edited')
  })
})
