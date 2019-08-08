local use_test_server
use_test_server = require("lapis.spec").use_test_server
local request
request = require("lapis.spec.server").request
return describe("soliCMS", function()
  use_test_server()
  return it("should load /", function()
    local status, body, headers = request("/")
    return assert.same(302, status)
  end)
end)
