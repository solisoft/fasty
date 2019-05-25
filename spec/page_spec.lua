local use_test_server
use_test_server = require("lapis.spec").use_test_server
local request
request = require("lapis.spec.server").request
return describe("soliCMS", function()
  use_test_server()
  it("should load /", function()
    local status, body, headers = request("/")
    return assert.same(302, status)
  end)
  it("should load /en/my/home", function()
    local status, body, headers = request("/en/my/home")
    return assert.same(401, status)
  end)
  return it("should load /en/my/home with basic auth", function()
    local status, body, headers = request("/en/my/home", {
      headers = {
        ["Authorization"] = "Basic c29saTp3aWxsb3c="
      }
    })
    return assert.same(200, status)
  end)
end)
