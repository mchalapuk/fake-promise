
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

  describe "when after .resolve() without result", ->
    nextPromise = null

    beforeEach ->
      nextPromise = testedPromise.resolve()
      undefined

    describe "and after calling .setResult(result)", ->
      result = "result"

      beforeEach ->
        testedPromise.setResult result

      it "calling .then(callback) calls the callback immediately", ->
        callback = sinon.spy()
        testedPromise.then callback
        callback.should.have.callCount 1
          .and.have.been.calledWith result

      it "calling .catch(callback) does nothing", ->
        callback = sinon.spy()
        testedPromise.catch callback
        callback.should.have.callCount 0

  describe "when after .resolve() with resolved promise as result", ->
    nextPromise = null
    result = "result"

    beforeEach ->
      resultPromise = new FakePromise
      resultPromise.resolve result
      nextPromise = testedPromise.resolve resultPromise
      undefined

    it "calling .then(callback) calls the callback immediately", ->
      callback = sinon.spy()
      testedPromise.then callback
      callback.should.have.callCount 1
        .and.have.been.calledWith result

    it "calling .catch(callback) does nothing", ->
      callback = sinon.spy()
      testedPromise.catch callback
      callback.should.have.callCount 0

  describe "when after .resolve() with rejected promise as result", ->
    nextPromise = null
    error = new Error "rejected"

    beforeEach ->
      resultPromise = new FakePromise
      resultPromise.reject error
      nextPromise = testedPromise.resolve resultPromise
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
      testedPromise.setResult undefined
      testedPromise.resolve()
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

  describe "when after .then(returnResolvedPromise).then(onfulfilled) specified", ->
    thenCallback = null

    beforeEach ->
      thenCallback = sinon.spy()
      resultPromise = new FakePromise
      testedPromise
        .then (arg) ->
          resultPromise.resolve arg
          resultPromise
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

  describe "when after .then(returnRejectedPromise).catch(onfulfilled) specified", ->
    catchCallback = null

    beforeEach ->
      catchCallback = sinon.spy()
      resultPromise = new FakePromise
      testedPromise
        .then (arg) ->
          resultPromise.reject arg
          resultPromise
        .catch catchCallback
      undefined

    describe "and after calling .resolve(arg).resolve()", ->
      arg = "I will behave"

      beforeEach ->
        testedPromise.resolve arg
          .resolve()
          .reject()
        undefined

      it "calls proper callback", ->
        catchCallback.should.have.callCount 1
      it "passes result to callback", ->
        catchCallback.should.have.been.calledWith arg

  describe "when after .catch(rethrow).catch(onrejected) specified", ->
    catchCallback = null

    beforeEach ->
      catchCallback = sinon.spy()
      testedPromise
        .catch (err) -> throw err
        .catch catchCallback
      undefined

    describe "and after calling .reject(arg).reject()", ->
      err = new Error "This promise is a fake one"

      beforeEach ->
        testedPromise.reject err
          .reject()
        undefined

      it "calls proper callback", ->
        catchCallback.should.have.callCount 1
      it "passes error to callback", ->
        catchCallback.should.have.been.calledWith err

  describe "when after .catch(returnRejectedPromise).catch(onrejected) specified", ->
    catchCallback = null

    beforeEach ->
      catchCallback = sinon.spy()
      resultPromise = new FakePromise
      testedPromise
        .catch (err) ->
          resultPromise.reject err
          resultPromise
        .catch catchCallback
      undefined

    describe "and after calling .reject(arg).reject()", ->
      err = new Error "This promise is a fake one"

      beforeEach ->
        testedPromise.reject err
          .reject()
        undefined

      it "calls proper callback", ->
        catchCallback.should.have.callCount 1
      it "passes error to callback", ->
        catchCallback.should.have.been.calledWith err

  describe "when after .catch(returnResolvedPromise).then(onrejected) specified", ->
    thenCallback = null

    beforeEach ->
      thenCallback = sinon.spy()
      resultPromise = new FakePromise
      testedPromise
        .catch (err) ->
          resultPromise.resolve err.message
          resultPromise
        .then thenCallback
      undefined

    describe "and after calling .reject(arg).resolve()", ->
      err = "This promise is a fake one"

      beforeEach ->
        testedPromise.reject new Error err
          .resolve()
        undefined

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes error to callback", ->
        thenCallback.should.have.been.calledWith err

  describe "when after .setResult(...) called", ->
    expectedResult = {}

    beforeEach ->
      testedPromise.setResult expectedResult

    it "calling .setResult(...) again throws an error", ->
      should -> testedPromise.setResult expectedResult
        .throw "result already set"
    it "calling .resolve(result) throws an error", ->
      should -> testedPromise.resolve expectedResult
        .throw "result already set"
    it "calling .setError(...) throws an error", ->
      should -> testedPromise.setError new Error 'test'
        .throw "trying to set error on a promise with result already set"
    it "calling .reject() throws an error", ->
      should -> testedPromise.reject()
        .throw "trying to reject a promise containing result"

    it "calling .resolve() does not throw", ->
      testedPromise.resolve().resolve()
      testedPromise.then (result) -> result.should.eql expectedResult

  describe "when after .setError(...) called", ->
    expectedError = new Error "test"

    beforeEach ->
      testedPromise.setError expectedError

    it "calling .setError(...) again throws an error", ->
      should -> testedPromise.setError expectedError
        .throw "error already set"
    it "calling .reject(error) throws an error", ->
      should -> testedPromise.reject expectedError
        .throw "error already set"
    it "calling .setError(...) throws an error", ->
      should -> testedPromise.setResult {}
        .throw "trying to set result on a promise with error already set"
    it "calling .resolve() throws an error", ->
      should () -> testedPromise.resolve()
        .throw "trying to resolve a promise containing error"

    it "calling .reject() does not throw", ->
      testedPromise.reject().resolve()
      testedPromise.then(
        -> throw new Error "expected rejection"
        (error) -> error.should.eql expectedError
      )

