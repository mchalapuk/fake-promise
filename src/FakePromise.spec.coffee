
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

  describe "when after .then(onfulfilled) specified", ->
    thenCallback = null

    beforeEach ->
      thenCallback = sinon.spy()
      testedPromise.then thenCallback
      undefined

    describe "and after calling .resolve(arg)", ->
      arg = "I will behave"

      beforeEach ->
        testedPromise.resolve arg

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes result to callback", ->
        thenCallback.should.have.been.calledWith arg

    describe "and after .catch(onrejected) specified", ->
      catchCallback = null

      beforeEach ->
        catchCallback = sinon.spy()
        testedPromise.catch catchCallback
        undefined

      describe "and after calling .reject(err)", ->
        err = new Error "I will never promise again"

        beforeEach ->
          testedPromise.reject err

        it "calls proper callback", ->
          catchCallback.should.have.callCount 1
        it "passes result to callback", ->
          catchCallback.should.have.been.calledWith err

  describe "when after .then(onfulfilled, onrejected) specified", ->
    thenCallback = null
    catchCallback = null

    beforeEach ->
      thenCallback = sinon.spy()
      catchCallback = sinon.spy()
      testedPromise.then thenCallback, catchCallback
      undefined

    describe "and after calling .resolve(arg)", ->
      arg = "I will clean my room"

      beforeEach ->
        testedPromise.resolve arg

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes result to callback", ->
        thenCallback.should.have.been.calledWith arg

    describe "and after calling .reject(err)", ->
      err = new Error "I will fulfill all promises"

      beforeEach ->
        testedPromise.reject err

      it "calls proper callback", ->
        catchCallback.should.have.callCount 1
      it "passes result to callback", ->
        catchCallback.should.have.been.calledWith err

