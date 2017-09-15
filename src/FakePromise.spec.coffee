
sinon = require "sinon"

FakePromise = require "./FakePromise"
  .default

describe "FakePromise", ->
  testedPromise = null

  beforeEach ->
    testedPromise = new FakePromise

  describe "just after creation", ->
    errorTests = [
      [ "resolve", ".resolve(...) called without any callback specified" ]
      [ "reject", ".reject(...) called without any callback specified" ]
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

    describe "and after calling .resolve(arg)", ->
      arg = "promises, promises"

      beforeEach ->
        testedPromise.resolve arg

      it "calls proper callback", ->
        thenCallback.have.callCount 1

