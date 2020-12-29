
var host = 'http://test.localhost:8080'
describe('Frontend / {{ splat | ... }}', function () {
  beforeEach(function () {
    cy.login()
  })

  it('Check Value on Frontend', function () {
    cy.create_page('splat', '<html><body>Hello {{ splat | hello }}</body></html>')
    cy.visit(host + '/en/display/splat/hello/world')
    cy.get('body').should('contain', 'Hello world')
  })
})
