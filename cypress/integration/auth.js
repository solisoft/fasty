import { utils } from "mocha";

var host = 'http://test.127.0.0.1.xip.io:8080'
describe('Core tests', function () {

  beforeEach(function () {
    cy.visit(host + '/static/admin/index.html')
    cy.get('#username').type('demo@foxxy.ovh');
    cy.get('#password').type('977cebdd');
    cy.get('button').click();
    cy.url().should('eq', host + '/static/admin/index.html#welcome')
  })

  it('Test partials & widgets', function () {
    cy.get('a[data-cy="partials"]').click();
    cy.get('body').should('contain', 'Listing partials')
    cy.url().should('eq', host + '/static/admin/index.html#partials')
    cy.contains('New partial').click()
    cy.url().should('match', /static\/admin\/index.html#partials\/\d+\/new/)
  })

})
