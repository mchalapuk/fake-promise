
sinon = require "sinon"

FakePromise = require "./FakePromise"
  .default

describe "FakePromise", ->
  testedPromise = null

  beforeEach ->
    testedPromise = new FakePromise
    undefined

  describe "just after creation", ->
    it "throws when calling .resolve(...)", ->
      should -> testedPromise.resolve null
        .throw new Error "promise not specified"
    it "throws when calling .reject(...)", ->
      should -> testedPromise.reject null
        .throw new Error "promise not specified"

  describe "when after .then(onfulfilled) specified", ->
    thenCallback = null
    nextPromise = null

    beforeEach ->
      thenCallback = sinon.spy()
      nextPromise = testedPromise.then thenCallback
      undefined

    it "throws calling .then(...) second time", ->
      should -> testedPromise.then thenCallback
        .throw new Error "promise already specified"
    it "throws calling .catch(...) on the same promise", ->
      should -> testedPromise.catch thenCallback
        .throw new Error "promise already specified"

    describe "and after calling .resolve(arg)", ->
      arg = "I will behave"

      beforeEach ->
        testedPromise.resolve arg
        undefined

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes result to callback", ->
        thenCallback.should.have.been.calledWith arg

    describe "and after .catch(onrejected) specified on returned promise", ->
      catchCallback = null

      beforeEach ->
        catchCallback = sinon.spy()
        nextPromise.catch catchCallback
        undefined

      describe "and after calling .reject(err).reject()", ->
        err = new Error "I will never promise again"

        beforeEach ->
          testedPromise.reject err
            .reject()
          undefined

        it "calls proper callback", ->
          catchCallback.should.have.callCount 1
        it "passes error to callback", ->
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
        undefined

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes result to callback", ->
        thenCallback.should.have.been.calledWith arg

    describe "and after calling .reject(err)", ->
      err = new Error "I will fulfill all promises"

      beforeEach ->
        testedPromise.reject err
        undefined

      it "calls proper callback", ->
        catchCallback.should.have.callCount 1
      it "passes error to callback", ->
        catchCallback.should.have.been.calledWith err

  describe "when after .then(passThrough).then(onfulfilled) specified", ->
    thenCallback = null

    beforeEach ->
      thenCallback = sinon.spy()
      testedPromise
        .then (arg) -> arg
        .then thenCallback
      undefined

    describe "and after calling .resolve(arg).resolve()", ->
      arg = "I will behave"

      beforeEach ->
        testedPromise.resolve arg
          .resolve()
        undefined

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes result to callback", ->
        thenCallback.should.have.been.calledWith arg

  describe "when after .catch(rethrow).catch(onrejected) specified", ->
    catchCallback = null

    beforeEach ->
      catchCallback = sinon.spy()
      testedPromise
        .catch (err) -> throw err
        .catch catchCallback
      undefined

    describe "and after calling .reject(arg).reject()", ->
      err = "I will not promise anything connected with promises"

      beforeEach ->
        testedPromise.reject err
          .reject()
        undefined

      it "calls proper callback", ->
        catchCallback.should.have.callCount 1
      it "passes error to callback", ->
        catchCallback.should.have.been.calledWith err

