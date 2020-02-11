var host = 'http://demo.127.0.0.1.xip.io:8080'
describe('Static page test', function () {
  it('Test Need a DB page', function () {
    cy.visit(hpst + '/need_a_db')
    cy.get('body').should('contain', 'Your account is not yet configured')
  })
})
