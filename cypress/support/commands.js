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
var host = 'http://test.127.0.0.1.xip.io:8080'
var host_admin = host + '/static/admin'

Cypress.Commands.add("login", () => {
  cy.visit(host_admin + '/login.html')
  cy.get('#username').type('demo@foxxy.ovh');
  cy.get('#password').type('977cebdd');
  cy.get('button').click();
  cy.visit(host_admin + '/index.html');
  cy.url().should('eq', host_admin + '/index.html#welcome');
})

Cypress.Commands.add("create_page", (slug, html) => {
  cy.visit(host_admin + '/#datasets/pages')
  cy.contains('New page').click()
  cy.get('#name').type(slug);
  cy.get('#slug').type(slug);
  cy.get('#raw_html').then(elem => { elem.val(html) })
  cy.get('input[type="submit"]').click();
  cy.get('body').should('contain', 'Successfully')
})

Cypress.Commands.add("create_aql", (slug, aql) => {
  cy.visit(host_admin + '/#datasets/aqls')
  cy.contains(' New aql').click()
  cy.get('#slug').type(slug);
  cy.get('#aql').then(elem => { elem.val(aql) })
  cy.get('input[type="submit"]').click();
  cy.get('body').should('contain', 'Successfully')
})

Cypress.Commands.add("create_partial", (slug, html) => {
  cy.visit(host_admin + '/#datasets/partials')
  cy.contains('New partial').click()
  cy.get('#name').type(slug);
  cy.get('#slug').type(slug);
  cy.get('#html').then(elem => { elem.val(html) })
  cy.get('input[type="submit"]').click();
  cy.get('body').should('contain', 'Successfully')
})

Cypress.Commands.add("delete_page", (title) => {
  cy.visit(host_admin + '/#datasets/pages')
  cy.contains(title).parent('tr').within(() => {
    cy.get('i.fa-trash-alt').click()
  })
  cy.get('div.uk-modal.uk-open').should('contain', 'Are you sure?')
  cy.get('button').contains('Ok').click()

  cy.get('body').contains(title).should('not.exist')
})

Cypress.Commands.add("delete_partial", (title) => {
  cy.visit(host_admin + '/#datasets/partials')
  cy.contains(title).parent('tr').within(() => {
    cy.get('i.fa-trash-alt').click()
  })
  cy.get('div.uk-modal.uk-open').should('contain', 'Are you sure?')
  cy.get('button').contains('Ok').click()

  cy.get('body').contains(title).should('not.exist')
})



Cypress.Commands.add("run_aql", (slug) => {
  cy.create_page('run_aql', '{{ aql | ' + slug + ' }} {{ aql | remove_run_aql }}')
  cy.visit(host + '/en/run_aql')
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
