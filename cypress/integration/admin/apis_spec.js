
var host = 'http://test.127.0.0.1.xip.io:8080/static/admin/'
describe('API', function () {

  beforeEach(function () {
    cy.login()
  })

  it('Loads api page', function () {
    cy.get('a[href="#apis"]').click();
    cy.get('body').should('contain', 'Listing apis')
    cy.get('div[data-is="apis"]').should('contain', 'New api')
  })

  it('Creates new api', function () {
    cy.get('a[href="#apis"]').click()
    cy.get('div[data-is="apis"]').contains('New api').click()
    cy.url().should('match', /static\/admin\/index.html#apis\/new/)
    cy.get('#name').type('testapi');
    cy.get('#manifest').then(elem => {
      elem.val('manifest.json')
    })
    cy.get('#package').then(elem => {
      elem.val('package.json')
    })
    cy.get('#code').then(elem => {
      elem.val('sample code here')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing apis')
    cy.get('td').should('contain', 'testapi')
  })

  it('Edits api', function () {
    cy.get('a[href="#apis"]').click()
    cy.contains('test').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#apis\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing api')
    cy.get('#name').invoke('val').should('eq', 'testapi')
    cy.get('#name').clear();
    cy.get('#name').type('testapiedited');
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing apis')
    cy.get('body').should('contain', 'testapiedited')
  })

  it('deletes an api', function () {
    cy.get('a[href="#apis"]').click()
    cy.contains('testapiedited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()

    cy.get('body').contains('testapiedited').should('not.exist')
  })
})
