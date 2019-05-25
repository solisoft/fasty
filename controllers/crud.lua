local lapis = require("lapis")
local http = require("lapis.nginx.http")
local respond_to, capture_errors
do
  local _obj_0 = require("lapis.application")
  respond_to, capture_errors = _obj_0.respond_to, _obj_0.capture_errors
end
local aql, document_get, document_put, document_delete, document_post
do
  local _obj_0 = require("lib.arango")
  aql, document_get, document_put, document_delete, document_post = _obj_0.aql, _obj_0.document_get, _obj_0.document_put, _obj_0.document_delete, _obj_0.document_post
end
do
  local _class_0
  local _parent_0 = lapis.Application
  local _base_0 = {
    [{
      cruds = "/crud/:type/:limit/:offset"
    }] = function(self)
      return {
        json = aql("FOR doc IN @@collection LIMIT @offset, @limit RETURN doc", {
          ["@collection"] = self.params.type,
          ["limit"] = tonumber(self.params.limit),
          ["offset"] = tonumber(self.params.offset)
        })
      }
    end,
    [{
      crud = "/crud/:type/:key"
    }] = respond_to({
      GET = function(self)
        return {
          json = document_get(self.params.type .. "/" .. self.params.key)
        }
      end,
      PUT = function(self)
        return {
          json = document_put(self.params.type .. "/" .. self.params.key, self.params)
        }
      end,
      DELETE = function(self)
        return {
          json = document_delete(self.params.type .. "/" .. self.params.key)
        }
      end
    }),
    [{
      crud = "/crud/:type"
    }] = respond_to({
      POST = function(self)
        return {
          json = document_post(self.params.type, self.params)
        }
      end
    })
  }
  _base_0.__index = _base_0
  setmetatable(_base_0, _parent_0.__base)
  _class_0 = setmetatable({
    __init = function(self, ...)
      return _class_0.__parent.__init(self, ...)
    end,
    __base = _base_0,
    __name = nil,
    __parent = _parent_0
  }, {
    __index = function(cls, name)
      local val = rawget(_base_0, name)
      if val == nil then
        local parent = rawget(cls, "__parent")
        if parent then
          return parent[name]
        end
      else
        return val
      end
    end,
    __call = function(cls, ...)
      local _self_0 = setmetatable({}, _base_0)
      cls.__init(_self_0, ...)
      return _self_0
    end
  })
  _base_0.__class = _class_0
  if _parent_0.__inherited then
    _parent_0.__inherited(_parent_0, _class_0)
  end
  return _class_0
end
