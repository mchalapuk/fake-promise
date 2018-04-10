require "source-map-support"
  .install()

require "should"
require "should-sinon"

errors = []

process.on "uncaugthException", (error) -> errors.push { type: "uncaughtException", error }
process.on "unhandledRejection", (error) -> errors.push { type: "unhandledRejection", error }

maybeThrow = ->
  return if errors.length is 0

  message = errors
    .map def => "#{def.type}#{def.error.stack}\n"
    .join ""

  errors.splice 0, errors.length
  throw new Error message

beforeEach maybeThrow
afterEach maybeThrow

