import { utils } from "mocha";

var host = 'http://test.127.0.0.1.xip.io:8080'
describe('Auth', function () {

  beforeEach(function () {
    cy.login()
  })

  it('Test partials & widgets', function () {
    cy.get('body').click();
    cy.get('body').should('contain', 'Listing partials')
    cy.url().should('eq', host + '/static/admin/index.html#partials')
    cy.contains('New partial').click()
    cy.url().should('match', /static\/admin\/index.html#partials\/\d+\/new/)
  })

})
