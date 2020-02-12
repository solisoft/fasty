
var host = 'http://test.127.0.0.1.xip.io:8080/static/admin/'
describe('Core tests', function () {

  before(function() {
    // login
    cy.visit(host + 'login.html')
    cy.get('#username').type('demo@foxxy.ovh');
    cy.get('#password').type('977cebdd');
    cy.get('button').click();
    cy.visit(host + 'index.html')
    cy.url().should('eq', host + 'index.html#welcome')

    // create layout to be use by redirection
    cy.get('a[href="#layouts"]').click()
    cy.get('div[data-is="layouts"]').contains('New layout').click()
    cy.url().should('match', /static\/admin\/index.html#layouts\/new/)
    cy.get('#name').type('rhome layout');
    cy.get('#html').then(elem => {
      elem.val('<html>sample rhome layout</html>')
    })
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing layouts')
    cy.get('td').should('contain', 'rhome layout')

  })

  beforeEach(function () {
    cy.visit(host + 'login.html')
    cy.get('#username').type('demo@foxxy.ovh');
    cy.get('#password').type('977cebdd');
    cy.get('button').click();
    cy.visit(host + 'index.html')
    cy.url().should('eq', host + 'index.html#welcome')
  })

  it('Loads redirections page', function () {
    cy.get('a[href="#redirections"]').click();
    cy.get('body').should('contain', 'Listing redirections')
    cy.get('div[data-is="redirections"]').should('contain', 'New redirection')
  })

  it('Creates new redirection', function () {
    cy.get('a[href="#redirections"]').click()
    cy.get('div[data-is="redirections"]').contains('New redirection').click()
    cy.url().should('match', /static\/admin\/index.html#redirections\/new/)
    cy.get('#name').type('ntest redirect');
    cy.get('#route').type('test redirect');
    cy.get('#class').type('redirect class');
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing redirections')
    cy.get('td').should('contain', 'test redirect')
  })

  it('Edits a redirection', function () {
    cy.get('a[href="#redirections"]').click()
    cy.contains('test redirect').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#redirections\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing redirection')
    cy.get('#route').invoke('val').should('eq', 'test redirect')
    cy.get('#route').clear();
    cy.get('#route').type('test redirect edited');
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing redirections')
    cy.get('td').should('contain', 'test redirect edited')
  })

  it('deletes a redirection', function () {
    cy.get('a[href="#redirections"]').click()
    cy.contains('test redirect edited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()

    cy.get('body').contains('test redirect edited').should('not.exist')
  })
})
