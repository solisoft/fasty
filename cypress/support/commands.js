// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
var host = 'http://test.127.0.0.1.xip.io:8080/static/admin/'

Cypress.Commands.add("login", () => {
  cy.visit(host + 'login.html')
  cy.get('#username').type('demo@foxxy.ovh');
  cy.get('#password').type('977cebdd');
  cy.get('button').click();
  cy.visit(host + 'index.html');
  cy.url().should('eq', host + 'index.html#welcome');
})

Cypress.Commands.add("create_page", (slug, html) => {
  cy.visit(host)
  cy.visit(host + '/#pages')
  cy.get('div[data-is="pages"]').contains('New page').click()
  cy.get('#name').type(slug);
  cy.get('#slug').type(slug);
  cy.get('#raw_html').then(elem => { elem.val(html) })
  cy.get('input[type="submit"]').click();
})

Cypress.Commands.add("create_aql", (slug, aql) => {
  cy.visit(host)
  cy.visit(host + '/#aqls')
  cy.get('div[data-is="aqls"]').contains('New aql').click()
  cy.get('#slug').type(slug);
  cy.get('#aql').then(elem => { elem.val(aql) })
  cy.get('input[type="submit"]').click();
})

Cypress.Commands.add("create_partial", (slug, html) => {
  cy.visit(host)
  cy.visit(host + '/#partials')
  cy.get('div[data-is="partials"]').contains('New partial').click()
  cy.get('#name').type(slug);
  cy.get('#slug').type(slug);
  cy.get('#html').then(elem => { elem.val(html) })
  cy.get('input[type="submit"]').click();
})

//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
