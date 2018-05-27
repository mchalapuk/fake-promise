
sinon = require "sinon"

FakePromise = require "./FakePromise"
  .default

if process.env.hasOwnProperty "DEBUG"
  # enable crazy debug logs
  OriginalFakePromise = FakePromise
  FakePromise = ->
    instance = new OriginalFakePromise
    new Proxy instance, new LoggingProxyHandler instance

describe "FakePromise", ->
  testedPromise = null

  beforeEach ->
    testedPromise = new FakePromise
    undefined

  it "calling .setError(undefined) throws", ->
    should -> testedPromise.setError undefined
      .throw "error must not be undefined nor null"
  it "calling .setError(null) throws", ->
    should -> testedPromise.setError null
      .throw "error must not be undefined nor null"

  describe "when after calling .resolveOne(null)", ->
    nextPromise = null

    beforeEach ->
      nextPromise = testedPromise.resolveOne null
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

    describe "and after calling .resolveOne(null).resolveOne()", ->
      beforeEach ->
        nextPromise.resolveOne()
        undefined

      it "calling .then(passThrough).then(callback) calls the callback immediately", ->
        callback = sinon.spy()
        testedPromise
          .then (arg) -> arg
          .then callback
        callback.should.have.callCount 1
          .and.have.been.calledWith null

  describe "when after .resolveOne() without result", ->
    nextPromise = null

    beforeEach ->
      nextPromise = testedPromise.resolveOne()
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

  describe "when after .resolveOne() with resolved promise as result", ->
    nextPromise = null
    result = "result"

    beforeEach ->
      resultPromise = new FakePromise
      resultPromise.resolveOne result
      nextPromise = testedPromise.resolveOne resultPromise
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

  describe "when after .resolveOne() with rejected promise as result", ->
    nextPromise = null
    error = new Error "rejected"

    beforeEach ->
      resultPromise = new FakePromise
      resultPromise.rejectOne error
      nextPromise = testedPromise.resolveOne resultPromise
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

  describe "when after calling .rejectOne(error)", ->
    error = new Error "test"
    nextPromise = null

    beforeEach ->
      nextPromise = testedPromise.rejectOne error
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

    describe "and after calling .rejectOne(error).rejectOne()", ->
      beforeEach ->
        nextPromise.rejectOne()
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

    it ".setResult(undefined).resolveOne() doesn't throw", ->
      testedPromise.setResult undefined
      testedPromise.resolveOne()
      undefined

    describe "and after calling .resolveOne(arg)", ->
      arg = "I will behave"

      beforeEach ->
        testedPromise.resolveOne arg
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

      describe "and after calling .rejectOne(err).rejectOne()", ->
        err = new Error "I will never promise again"

        beforeEach ->
          testedPromise.rejectOne err
            .rejectOne()
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

    describe "and after calling .resolveOne(arg)", ->
      arg = "I will clean my room"

      beforeEach ->
        testedPromise.resolveOne arg
        undefined

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes result to callback", ->
        thenCallback.should.have.been.calledWith arg

    describe "and after calling .rejectOne(err)", ->
      err = new Error "I will fulfill all promises"

      beforeEach ->
        testedPromise.rejectOne err
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

    describe "and after calling .resolveOne(arg).resolveOne()", ->
      arg = "I will behave"

      beforeEach ->
        testedPromise.resolveOne arg
          .resolveOne()
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
          resultPromise.resolveOne arg
          resultPromise
        .then thenCallback
      undefined

    describe "and after calling .resolveOne(arg).resolveOne()", ->
      arg = "I will behave"

      beforeEach ->
        testedPromise.resolveOne arg
          .resolveOne()
        undefined

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes result to callback", ->
        thenCallback.should.have.been.calledWith arg

  describe "when after .then(returnRejectedPromise).catch(onfulfilled) specified", ->
    catchCallback = null

    beforeEach ->
      catchCallback = sinon.spy()
      testedPromise
        .then (arg) ->
          resultPromise = new FakePromise
          resultPromise.rejectOne arg
          resultPromise
        .catch catchCallback
      undefined

    describe "and after calling .resolveOne(arg).resolveOne()", ->
      arg = "I will behave"

      beforeEach ->
        testedPromise.resolveOne arg
          .rejectOne()
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

    describe "and after calling .rejectOne(arg).rejectOne()", ->
      err = new Error "This promise is a fake one"

      beforeEach ->
        testedPromise.rejectOne err
          .rejectOne()
        undefined

      it "calls proper callback", ->
        catchCallback.should.have.callCount 1
      it "passes error to callback", ->
        catchCallback.should.have.been.calledWith err

  describe "when after .catch(returnRejectedPromise).catch(onrejected) specified", ->
    catchCallback = null

    beforeEach ->
      catchCallback = sinon.spy()
      testedPromise
        .catch (err) ->
          resultPromise = new FakePromise
          resultPromise.rejectOne err
          resultPromise
        .catch catchCallback
      undefined

    describe "and after calling .rejectOne(arg).rejectOne()", ->
      err = new Error "This promise is a fake one"

      beforeEach ->
        testedPromise.rejectOne err
          .rejectOne()
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
          resultPromise.resolveOne err.message
          resultPromise
        .then thenCallback
      undefined

    describe "and after calling .rejectOne(arg).resolveOne()", ->
      err = "This promise is a fake one"

      beforeEach ->
        testedPromise.rejectOne new Error err
          .resolveOne()
        undefined

      it "calls proper callback", ->
        thenCallback.should.have.callCount 1
      it "passes error to callback", ->
        thenCallback.should.have.been.calledWith err

  describe "when after .setResult(result) called", ->
    expectedResult = {}

    beforeEach ->
      testedPromise.setResult expectedResult

    it "calling .setResult(...) again throws an error", ->
      should -> testedPromise.setResult expectedResult
        .throw "result already set"
    it "calling .resolveOne(result) throws an error", ->
      should -> testedPromise.resolveOne expectedResult
        .throw "result already set"
    it "calling .setError(...) throws an error", ->
      should -> testedPromise.setError new Error 'test'
        .throw "trying to set error on a promise with result already set"
    it "calling .rejectOne() throws an error", ->
      should -> testedPromise.rejectOne()
        .throw "trying to reject a promise containing result"

    it "calling .resolveOne() does not throw", ->
      testedPromise.resolveOne().resolveOne()
      testedPromise.then (result) -> result.should.eql expectedResult

  describe "when after .setResult(resolvedPromise) called", ->
    expectedResult = {}

    beforeEach ->
      resultPromise = new FakePromise
      resultPromise.resolveOne expectedResult
      testedPromise.setResult resultPromise

    it "calling .setResult(...) again throws an error", ->
      should -> testedPromise.setResult expectedResult
        .throw "result already set"
    it "calling .resolveOne(result) throws an error", ->
      should -> testedPromise.resolveOne expectedResult
        .throw "result already set"
    it "calling .setError(...) throws an error", ->
      should -> testedPromise.setError new Error 'test'
        .throw "trying to set error on a promise with result already set"
    it "calling .rejectOne() throws an error", ->
      should -> testedPromise.rejectOne()
        .throw "trying to reject a promise containing result"

    it "calling .resolveOne() does not throw", ->
      testedPromise.resolveOne().resolveOne()
      testedPromise.then (result) -> result.should.eql expectedResult

  describe "when after .setError(error) called", ->
    expectedError = new Error "test"

    beforeEach ->
      testedPromise.setError expectedError

    it "calling .setError(...) again throws an error", ->
      should -> testedPromise.setError expectedError
        .throw "error already set"
    it "calling .rejectOne(error) throws an error", ->
      should -> testedPromise.rejectOne expectedError
        .throw "error already set"
    it "calling .setError(...) throws an error", ->
      should -> testedPromise.setResult {}
        .throw "trying to set result on a promise with error already set"
    it "calling .resolveOne() throws an error", ->
      should () -> testedPromise.resolveOne()
        .throw "trying to resolve a promise containing error"

    it "calling .rejectOne() does not throw", ->
      testedPromise.rejectOne().resolveOne()
      testedPromise.then(
        -> throw new Error "expected rejection"
        (error) -> error.should.eql expectedError
      )

  describe "when after .setResult(rejectedPromise) called", ->
    expectedError = new Error "test"

    beforeEach ->
      resultPromise = new FakePromise
      resultPromise.rejectOne expectedError
      testedPromise.setResult resultPromise

    it "calling .setError(...) again throws an error", ->
      should -> testedPromise.setError expectedError
        .throw "error already set"
    it "calling .rejectOne(error) throws an error", ->
      should -> testedPromise.rejectOne expectedError
        .throw "error already set"
    it "calling .setError(...) throws an error", ->
      should -> testedPromise.setResult {}
        .throw "trying to set result on a promise with error already set"
    it "calling .resolveOne() throws an error", ->
      should () -> testedPromise.resolveOne()
        .throw "trying to resolve a promise containing error"

    it "calling .rejectOne() does not throw", ->
      testedPromise.rejectOne().resolveOne()
      testedPromise.then(
        -> throw new Error "expected rejection"
        (error) -> error.should.eql expectedError
      )

  describe "when after calling .setResult(undefined)", ->
    expectedResult = undefined

    beforeEach ->
      testedPromise.setResult expectedResult

    it "calling .resolveOne() does not throw", ->
      testedPromise.resolveOne().resolveOne()
      testedPromise.then (result) -> (should result).equal expectedResult

indent = 0

class FunctionProxyHandler
  constructor: (@name, @parent) ->
  apply: (target, thisArg, argumentList) ->
    @parent.log "call".yellow, "#{@name}(#{(argumentList.map stringifyArg).join ", " })"
    indent += 1
    try
      result = target.apply thisArg, argumentList
    catch e
      @parent.log "throw".red, stringifyArg e
      indent -= 1
      throw e
    @parent.log "return".green, stringifyArg result
    indent -= 1
    result

class LoggingProxyHandler
  constructor: (@target) ->
    @indent = 0
  get: (target, property, receiver) ->
    value = target[property]
    if property in ["id", "nextPromise"]
      return value
    @log "get".blue, "#{property} -> #{stringifyArg value}"
    if typeof value is "function"
      new Proxy value, new FunctionProxyHandler property, @
    else
      value
  set: (target, property, value, receiver) ->
    previous = target[property]
    @log "set".magenta, "#{property} = #{stringifyArg value}"
    if property is "nextPromise"
      value = new Proxy value, new LoggingProxyHandler value
    target[property] = value
    true
  log: (operation, args) ->
    console.log "#{printIndent()}#{"##{@target.id}".gray} #{operation} #{if args then args.gray else ""}"

printIndent = ->
  "                                                             ".substring 0, indent * 2

stringifyArg = (arg) ->
  if arg instanceof OriginalFakePromise
    "FakePromise##{arg.id}"
  else if arg instanceof Error
    "#{arg.name}(#{JSON.stringify arg.message})"
  else if typeof arg is "function"
    "function #{arg.name or "unnamed"}"
  else
    JSON.stringify arg

