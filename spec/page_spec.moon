import use_test_server from require "lapis.spec"
import request from require "lapis.spec.server"

describe "soliCMS", ->
  use_test_server!

  it "should load /", ->
    status, body, headers = request "/"
    assert.same 200, status

  it "should load /en/my/home", ->
    status, body, headers = request "/en/my/home"
    assert.same 401, status

  it "should load /en/my/home with basic auth", ->
    status, body, headers = request("/en/my/home", headers: { "Authorization": "Basic c29saTp3aWxsb3c=" })
    assert.same 200, status