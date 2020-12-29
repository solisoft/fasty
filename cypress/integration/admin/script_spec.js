
var host = 'http://test.127.0.0.1.xip.io:8080/static/admin/'
describe('Scripts', function () {

  beforeEach(function () {
    cy.login()
  })

  it('Loads script page', function () {
    cy.get('a[href="#datasets/scripts"]').click();
    cy.get('body').should('contain', 'Listing scripts')
    cy.get('body').should('contain', 'New script')
  })

  it('Creates new script', function () {
    cy.get('a[href="#datasets/scripts"]').click()
    cy.get('body').contains('New script').click()
    cy.url().should('match', /static\/admin\/index.html#datasets\/scripts\/new/)
    cy.get('#name').type('testscript')
    cy.get('#package').then(elem => {
      elem.val('package.json')
    })
    cy.get('#code').then(elem => {
      elem.val('sample code here')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing scripts')
    cy.get('td').should('contain', 'testscript')
  })

  it('Edits script', function () {
    cy.get('a[href="#datasets/scripts"]').click()
    cy.contains('test').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#datasets\/scripts\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing script')
    cy.get('#name').invoke('val').should('eq', 'testscript')
    cy.get('#name').clear();
    cy.get('#name').type('testscriptedited');
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing scripts')
    cy.get('body').should('contain', 'testscriptedited')
  })

  it('deletes an script', function () {
    cy.get('a[href="#datasets/scripts"]').click()
    cy.contains('testscriptedited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()

    cy.get('body').contains('testscriptedited').should('not.exist')
  })
})
