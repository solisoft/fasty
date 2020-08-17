
var host = 'http://test.127.0.0.1.xip.io:8080/static/admin/'
describe('Pages', function () {

  beforeEach(function () {
    cy.login()
  })

  it('Loads pages editor', function () {
    cy.get('a[href="#datasets/pages"]').click();
    cy.get('body').should('contain', 'Listing pages')
    cy.get('body').should('contain', 'New page')
  })

  it('Creates new page', function () {
    cy.get('a[href="#pages"]').click()
    cy.get('body').contains('New page').click()
    cy.url().should('match', /static\/admin\/index.html#datasets\/pages\/\d+\/new/)
    cy.get('#name').type('home page 1');
    cy.get('#slug').type('homepage1');
    cy.get('#raw_html').then(elem => {
      elem.val('<html>sample test page</html>')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing pages')
    cy.get('td').should('contain', 'home page 1')
  })

  it('Edits a page', function () {
    cy.get('a[href="#datasets/pages"]').click()
    cy.contains('home page 1').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#datasets\/pages\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing page')
    cy.get('#name').invoke('val').should('eq', 'home page 1')
    cy.get('#name').clear();
    cy.get('#name').type('home page edited');
    cy.get('#raw_html').then(elem => {
      elem.val('<html>sample page edited</html>')
    })
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing pages')
    cy.get('td').should('contain', 'home page edited')
  })

  it('deletes a page', function () {
    cy.delete_page('home page edited')
  })
})
