
var host = 'http://test.localhost:8080'
var admin_host = host + '/static/admin'

describe('Frontend / {{ lang }}', function () {
  beforeEach(function () {
    cy.login()
  })

  it('Check', function () {
    cy.create_page('lang', 'page is {{ lang }}')

    cy.visit(host + '/en/lang')
    cy.get('body').should('contain', 'page is en')

  })
})
