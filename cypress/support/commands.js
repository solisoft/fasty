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
  console.log(window.localStorage)
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
