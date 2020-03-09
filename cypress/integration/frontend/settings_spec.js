
var host = 'http://test.127.0.0.1.xip.io:8080'
var admin_host = host + '/static/admin'

describe('Frontend / {{ settings | key }}', function () {
  beforeEach(function () {
    cy.login()
  })

  it('Check', function () {
    cy.create_page('settings', 'page is {{ settings | slug }}')
    cy.visit(host + '/en/settings')
    cy.get('body').should('contain', 'page is home')
  })
})
