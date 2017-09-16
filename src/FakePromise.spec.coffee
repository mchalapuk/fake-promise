
sinon = require "sinon"

FakePromise = require "./FakePromise"
  .default

describe "FakePromise", ->
  testedPromise = null

  beforeEach ->
    testedPromise = new FakePromise
    undefined

  describe "just after creation", ->
    errorTests = [
      [ "resolve", ".resolve(...) called without .then(...) callback specified" ]
      [ "reject", ".reject(...) called without .then(...) callback specified" ]
    ]
    errorTests.forEach (params) ->
      [ methodName, expectedError ] = params

      it "throws new Error('#{expectedError}') when calling .#{methodName}(...)", ->
        (should -> testedPromise[methodName] null).throw new Error expectedError

  describe "when after .then() specified", ->
    thenCallback = null

    beforeEach ->
      thenCallback = sinon.spy()
      testedPromise.then thenCallback
      undefined

    describe "and after calling .resolve(arg)", ->
      arg = "promises, promises"

      beforeEach ->
        testedPromise.resolve arg

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1

