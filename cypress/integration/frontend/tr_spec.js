
var host = 'http://test.localhost:8080'
var admin_host = host + '/static/admin'
describe('Frontend / {{ tr | key }}', function () {
  beforeEach(function () {
    cy.login()
  })

  it('Check Trads', function () {
    cy.create_page('trads', '<html><body>Hello {{ tr | World }}</body></html>')
    cy.visit(host + '/en/trads')
    cy.get('body').should('contain', 'Hello World')

    cy.visit(admin_host + '/#datasets/trads')
    cy.get('body').should('contain', 'World')
  })
})
