
sinon = require "sinon"

FakePromise = require "./FakePromise"
  .default

describe "FakePromise", ->
  testedPromise = null

  beforeEach ->
    testedPromise = new FakePromise
    undefined

  describe "when after calling .resolve(null)", ->
    nextPromise = null

    beforeEach ->
      nextPromise = testedPromise.resolve null
      undefined

    it "calling .then(callback) calls the callback immediately", ->
      callback = sinon.spy()
      testedPromise.then callback
      callback.should.have.callCount 1
        .and.have.been.calledWith null

    it "calling .catch(callback) does nothing", ->
      callback = sinon.spy()
      testedPromise.catch callback
      callback.should.have.callCount 0

    describe "and after calling .resolve(null).resolve()", ->
      beforeEach ->
        nextPromise.resolve()
        undefined

      it "calling .then(passThrough).then(callback) calls the callback immediately", ->
        callback = sinon.spy()
        testedPromise
          .then (arg) -> arg
          .then callback
        callback.should.have.callCount 1
          .and.have.been.calledWith null

  describe "when after calling .reject(error)", ->
    error = new Error "test"
    nextPromise = null

    beforeEach ->
      nextPromise = testedPromise.reject error
      undefined

    it "calling .catch(callback) calls the callback immediately", ->
      callback = sinon.spy()
      testedPromise.catch callback
      callback.should.have.callCount 1
        .and.have.been.calledWith error

    it "calling .then(callback) does nothing", ->
      callback = sinon.spy()
      testedPromise.then callback
      callback.should.have.callCount 0

    describe "and after calling .reject(error).reject()", ->
      beforeEach ->
        nextPromise.reject()
        undefined

      it "calling .catch(rethrow).catch(callback) calls the callback immediately", ->
        callback = sinon.spy()
        testedPromise
          .catch (me) -> throw me
          .catch callback
        callback.should.have.callCount 1
          .and.have.been.calledWith error

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

    it ".setResult(undefined).resolve() doesn't throw", ->
      (testedPromise.setResult undefined).resolve()
      undefined

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

