
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

  it('Loads script page', function () {
    cy.get('a[href="#scripts"]').click();
    cy.get('body').should('contain', 'Listing scripts')
    cy.get('div[data-is="scripts"]').should('contain', 'New script')
  })

  it('Creates new script', function () {
    cy.get('a[href="#scripts"]').click()
    cy.get('div[data-is="scripts"]').contains('New script').click()
    cy.url().should('match', /static\/admin\/index.html#scripts\/new/)
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
    cy.get('a[href="#scripts"]').click()
    cy.contains('test').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#scripts\/\d+\/edit/)
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
    cy.get('a[href="#scripts"]').click()
    cy.contains('testscriptedited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()
  
    cy.get('body').contains('testscriptedited').should('not.exist')
  })
})
