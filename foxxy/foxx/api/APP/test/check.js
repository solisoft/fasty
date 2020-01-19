/*jshint -W097, -W033, node: true, esversion: 6 */

"use strict";
const { expect } = require("chai");
const request = require("@arangodb/request");
const { baseUrl } = module.context;

describe("this service", () => {
  it("should return an valid response with no arguments", () => {
    console.log(baseUrl)
    const response = request.get(baseUrl + '/posts');
    expect(response.status).to.equal(200);
  });

  it("should return an valid response with limit argument", () => {
    const response = request.get(baseUrl + '/posts' + "?limit=2");
    expect(response.status).to.equal(200);
  });

  it("should return an valid response with limi & offset argument", () => {
    const response = request.get(baseUrl + '/posts' + "?limit=2&offset=2");
    expect(response.status).to.equal(200);
  });

  it("should return an valid response with order argument", () => {
    const response = request.get(baseUrl + '/posts' + "?order=_id,-_key");
    expect(response.status).to.equal(200);
  });

  it("should return an valid response with fields argument", () => {
    const response = request.get(baseUrl + '/posts' + "?fields=_key");
    expect(response.status).to.equal(200);
  });

  it("should return an valid response with filtering", () => {
    const response = request.get(baseUrl + '/posts' + "?_key=abcd");
    expect(response.status).to.equal(200);
  });

});