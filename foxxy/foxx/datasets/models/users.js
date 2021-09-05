const model = function() {
  return {
    model: [
      { r: true, c: "1-2", n: "fn", t: "string", j: "joi.string().required()", l: "First Name" },
      { r: false, c: "1-2", n: "ln", t: "string", j: "joi.string().required()", l: "Last Name" },
      { r: true, c: "1-3", n: "username", t: "string", j: "joi.string().required()", l: "Email" },
      { r: false, c: "1-3", n: "role", t: "string", j: "joi.string().required()", l: "Role" },
      { r: false, c: "1-3", n: "a", t: "boolean", j: "joi.number().integer()", l: "Active?" },
      { r: true, c: "1-2", n: "password", t: "password", j: "joi.any()", l: "Password" },
      { r: false, c: "1-2", n: "password_confirmation", t: "password_confirmation", j: "joi.any().valid(joi.ref('password')).options({ language: { any: { allowOnly: 'must match password' } } })", l: "Password confirmation" },
      { r: true, c: "1-1", n: "image", t: "image", j: "joi.string()", l: "Avatar" }
    ],
    collection: "users",
    singular: "user",
    columns: [
      { name: "fn", label: "First Name" },
      { name: "ln", label: "Last Name" },
      { name: "username", label: "Email" },
      { name: "role", label: "Roles" },
      { name: "image" }
    ],
    roles: {
      read: ['admin'],
      write: ['admin']
    }
  }
}
module.exports = model