
var host = 'http://test.127.0.0.1.xip.io:8080/static/admin/'
describe('Users', function () {

  beforeEach(function () {
    // cy.visit(host + '/static/admin/index.html')
    cy.visit(host + 'login.html')
    cy.get('#username').type('demo@foxxy.ovh');
    cy.get('#password').type('977cebdd');
    cy.get('button').click();
    cy.visit(host + 'index.html')
    cy.url().should('eq', host + 'index.html#welcome')
  })

  it('Loads users page', function () {
    cy.get('a[href="#datasets/users"]').click();
    cy.get('body').should('contain', 'Listing users')
    cy.get('div[data-is="users"]').should('contain', 'New user')
  })

  it('Creates new user', function () {
    cy.get('a[href="#datasets/users"]').click()
    cy.get('div[data-is="users"]').contains('New user').click()
    cy.url().should('match', /static\/admin\/index.html#datasets\/users\/new/)
    cy.get('#fn').type('test');
    cy.get('#ln').type('user');
    cy.get('#username').type('testuser@email.com');
    cy.get('#role').type('User');
    cy.get('#password').type('1111');
    cy.get('#password_confirmation').type('1111');
    cy.get('input[type="submit"]').click();
    cy.reload()
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing users')
    cy.get('td').should('contain', 'test')
  })

  it('Edits a user', function () {
    cy.get('a[href="#datasets/users"]').click()
    cy.contains('test').parent('tr').within(() => {
      cy.get('i.fa-edit').click()
    })
    cy.url().should('match', /static\/admin\/index.html#datasets\/users\/\d+\/edit/)
    cy.get('body').should('contain', 'Editing user')
    cy.get('#fn').invoke('val').should('eq', 'test')
    cy.get('#fn').clear();
    cy.get('#fn').type('test edited');
    cy.get('input[type="submit"]').click();
    cy.get('a.uk-button').contains('Back').click()
    cy.get('body').should('contain', 'Listing users')
    cy.get('td').should('contain', 'test edited')
  })

  it('deletes a user', function () {
    cy.get('a[href="#datasets/users"]').click()
    cy.contains('test edited').parent('tr').within(() => {
      cy.get('i.fa-trash-alt').click()
    })
    cy.get('div.uk-modal').should('contain', 'Are you sure?')
    cy.get('button').contains('Ok').click()

    cy.get('body').contains('test edited').should('not.exist')
  })
})
