import { utils } from "mocha";

var host = 'http://localhost:8080'
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

  it('Test AQLs', function () {
  })

  it('Test Helpers', function () {
  })

  it('Test Layouts', function () {
  })

  it('Test components', function () {
  })

  it('Test API', function () {
  })

  it('Test Scripts', function () {
  })

  it('test {{ partial ... }}', function () {
  })

  it('test {{ tr ... }}', function () {
  })

  it('test {{ page ... }}', function () {
  })

  it('test {{ riot ... }}', function () {
  })

  it('test {{ helper ... }}', function () {
  })

  it('test {{ lang }}', function () {
  })

  it('test {{ settings ... }}', function () {
  })

  it('test {{ spa ... }}', function () {
  })

  it('test {{ splat ... }}', function () {
  })

  it('test {{ aql ... }}', function () {
  })

  it('test {{ external ... }}', function () {
  })

})
