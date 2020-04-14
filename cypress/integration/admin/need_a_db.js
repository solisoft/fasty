var host = 'http://test.127.0.0.1.xip.io:8080'
describe('Need a DB page', function () {
  it('Test Need a DB page', function () {
    cy.visit(host + '/need_a_db')
    cy.get('body').should('contain', 'Your account is not yet configured')
  })
})
