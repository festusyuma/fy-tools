import { type } from "arktype"

const User = type({
  name: "string",
  age: "number"
})

console.log(User)
