
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

  it('Loads pages editor', function () {
    cy.get('a[href="#pages"]').click();
    cy.get('body').should('contain', 'Listing pages')
    cy.get('div[data-is="pages"]').should('contain', 'New page')
  })

  it('Creates new page', function () {
    cy.get('a[href="#pages"]').click()
    cy.get('div[data-is="pages"]').contains('New page').click()
    cy.url().should('match', /static\/admin\/index.html#pages\/\d+\/new/)
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
    cy.get('a[href="#pages"]').click()
    cy.contains('home page 1').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#pages\/\d+\/edit/)
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
    cy.get('a[href="#pages"]').click()
    cy.contains('home page edited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()

    cy.get('td').contains('home page edited').should('not.exist')
  })
})
