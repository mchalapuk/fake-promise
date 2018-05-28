
sinon = require "sinon"

FakePromise = require "./FakePromise"
  .default

describe "FakePromise", ->
  testedPromise = null

  [ null, undefined ].forEach (arg) ->
    it "calling static .reject(#{arg}) throws", ->
      should -> FakePromise.reject arg
        .throw "error must not be undefined nor null"

  describe "when constructed with Promise.reject(error)", ->
    expectedError = new Error "test"

    beforeEach ->
      testedPromise = FakePromise.reject expectedError
      undefined

    it "calling .setError(...) again throws an error", ->
      should -> testedPromise.setError expectedError
        .throw "error already set"
    it "calling .reject(error) throws an error", ->
      should -> testedPromise.reject expectedError
        .throw "error already set"
    it "calling .rejectOne(error) throws an error", ->
      should -> testedPromise.rejectOne expectedError
        .throw "error already set"
    it "calling .reject() throws an error", ->
      should -> testedPromise.reject()
        .throw "promise already rejected"
    it "calling .rejectOne() throws an error", ->
      should -> testedPromise.rejectOne()
        .throw "promise already rejected"
    it "calling .setResult(...) throws an error", ->
      should -> testedPromise.setResult {}
        .throw "trying to set result on a promise with error already set"
    it "calling .resolve() throws an error", ->
      should () -> testedPromise.resolve()
        .throw "trying to resolve a promise containing error"
    it "calling .resolveOne() throws an error", ->
      should () -> testedPromise.resolveOne()
        .throw "trying to resolve a promise containing error"

    it "resolves full promise chain", ->
      testedPromise
        .catch (err) ->
          err.should.equal expectedError
          err
        .then (err) ->
          err.should.equal expectedError
          throw err
        .then(
          (result) -> throw new Error "expected rejection"
          (err) -> err.should.equal expectedError
        )

    it "forwards the error to next promise in chain", ->
      testedPromise
        .then (result) ->
          throw new Error "expected rejection got result: #{result}"
        .then(
          (result) -> throw new Error "expected rejection got result: #{result}"
          (err) -> err.should.equal expectedError
        )

  describe "when constructed with Promise.resolve(result)", ->
    expectedResult = result: "test"

    beforeEach ->
      testedPromise = FakePromise.resolve expectedResult
      undefined

    it "calling .setError(...) again throws an error", ->
      should -> testedPromise.setError new Error "test"
        .throw "trying to set error on a promise with result already set"
    it "calling .reject(error) throws an error", ->
      should -> testedPromise.reject new Error "test"
        .throw "trying to reject a promise containing result"
    it "calling .rejectOne(error) throws an error", ->
      should -> testedPromise.rejectOne new Error "test"
        .throw "trying to reject a promise containing result"
    it "calling .reject() throws an error", ->
      should -> testedPromise.reject()
        .throw "trying to reject a promise containing result"
    it "calling .rejectOne() throws an error", ->
      should -> testedPromise.rejectOne()
        .throw "trying to reject a promise containing result"
    it "calling .setResult(...) throws an error", ->
      should -> testedPromise.setResult {}
        .throw "result already set"
    it "calling .resolve() throws an error", ->
      should () -> testedPromise.resolve()
        .throw "promise already resolved"
    it "calling .resolveOne() throws an error", ->
      should () -> testedPromise.resolveOne()
        .throw "promise already resolved"

    it "resolves full promise chain", ->
      error = new Error "error"

      testedPromise
        .then (result) ->
          result.should.equal expectedResult
          throw error
        .catch (err) ->
          err.should.equal error
          err
        .catch(
          (result) -> throw new Error "expected rejection got result: #{result}"
          (err) -> err.should.equal error
        )

    it "forwards the result to next promise in chain", ->
      testedPromise
        .catch (err) ->
          throw err
        .then (result) ->
          result.should.equal expectedResult

  describe "when instantiated with new", ->
    beforeEach ->
      testedPromise = new FakePromise
      undefined

    [ 'setError', 'reject', 'rejectOne' ].forEach (methodName) ->
      [ null, undefined ].forEach (arg) ->
        it "calling .#{methodName}(#{arg}) throws", ->
          should -> testedPromise[methodName] arg
            .throw "error must not be undefined nor null"

    describe "when after calling .resolve(result)", ->
      expectedResult = {}

      beforeEach ->
        testedPromise.resolve expectedResult

      it "resolves full promise chain", ->
        error = new Error "test"

        testedPromise
          .then (result) ->
            result.should.equal expectedResult
            throw error
          .catch (err) ->
            err.should.equal error
            expectedResult
          .then (result) ->
            (should result).equal expectedResult
            throw error
          .then(
            (result) -> throw new Error "expected rejection"
            (err) -> err.should.equal error
          )

    describe "when after calling .reject(error)", ->
      expectedError = new Error "test"

      beforeEach ->
        testedPromise.reject expectedError

      it "resolves full promise chain", ->
        testedPromise
          .catch (err) ->
            err.should.equal expectedError
          .then ->
            throw expectedError
          .then(
            (result) -> throw new Error "expected rejection"
            (err) -> err.should.equal expectedError
          )

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

      describe "and after calling .catch(rethrow)", ->
        nextPromise = null

        beforeEach ->
          nextPromise = testedPromise.catch (me) -> throw me
          undefined

        describe "and after calling .rejectOne(error).rejectOne()", ->
          beforeEach ->
            nextPromise.rejectOne()
            undefined

          it "calling .catch(callback) calls the callback immediately", ->
            callback = sinon.spy()
            nextPromise.catch callback
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
      it "calling .resolve(result) throws an error", ->
        should -> testedPromise.resolve expectedResult
          .throw "result already set"
      it "calling .resolveOne(result) throws an error", ->
        should -> testedPromise.resolveOne expectedResult
          .throw "result already set"
      it "calling .setError(...) throws an error", ->
        should -> testedPromise.setError new Error 'test'
          .throw "trying to set error on a promise with result already set"
      it "calling .reject() throws an error", ->
        should -> testedPromise.reject()
          .throw "trying to reject a promise containing result"
      it "calling .rejectOne() throws an error", ->
        should -> testedPromise.rejectOne()
          .throw "trying to reject a promise containing result"

      it "calling .resolve() does not throw", ->
        testedPromise.resolve()
        testedPromise.then (result) -> result.should.eql expectedResult
      it "calling .resolveOne() does not throw", ->
        testedPromise.resolveOne().resolveOne()
        testedPromise.then (result) -> result.should.eql expectedResult

    describe "when after .setResult(resolvedPromise) called", ->
      expectedResult = {}

      beforeEach ->
        resultPromise = new FakePromise
        resultPromise.resolve expectedResult
        testedPromise.setResult resultPromise

      it "calling .setResult(...) again throws an error", ->
        should -> testedPromise.setResult expectedResult
          .throw "result already set"
      it "calling .resolve(result) throws an error", ->
        should -> testedPromise.resolve expectedResult
          .throw "result already set"
      it "calling .resolveOne(result) throws an error", ->
        should -> testedPromise.resolveOne expectedResult
          .throw "result already set"
      it "calling .setError(...) throws an error", ->
        should -> testedPromise.setError new Error 'test'
          .throw "trying to set error on a promise with result already set"
      it "calling .reject() throws an error", ->
        should -> testedPromise.reject()
          .throw "trying to reject a promise containing result"
      it "calling .rejectOne() throws an error", ->
        should -> testedPromise.rejectOne()
          .throw "trying to reject a promise containing result"

      it "calling .resolve() does not throw", ->
        testedPromise.resolve()
        testedPromise.then (result) -> result.should.eql expectedResult
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
      it "calling .reject(error) throws an error", ->
        should -> testedPromise.reject expectedError
          .throw "error already set"
      it "calling .rejectOne(error) throws an error", ->
        should -> testedPromise.rejectOne expectedError
          .throw "error already set"
      it "calling .setError(...) throws an error", ->
        should -> testedPromise.setResult {}
          .throw "trying to set result on a promise with error already set"
      it "calling .resolve() throws an error", ->
        should () -> testedPromise.resolve()
          .throw "trying to resolve a promise containing error"
      it "calling .resolveOne() throws an error", ->
        should () -> testedPromise.resolveOne()
          .throw "trying to resolve a promise containing error"

      it "calling .rejectOne() does not throw", ->
        testedPromise.rejectOne().resolveOne()
        testedPromise.then(
          -> throw new Error "expected rejection"
          (error) -> error.should.eql expectedError
        )
      it "calling .reject() does not throw", ->
        testedPromise.reject()
        testedPromise.then(
          -> throw new Error "expected rejection"
          (error) -> error.should.eql expectedError
        )

    describe "when after .setResult(rejectedPromise) called", ->
      expectedError = new Error "test"

      beforeEach ->
        resultPromise = new FakePromise
        resultPromise.reject expectedError
        testedPromise.setResult resultPromise

      it "calling .setError(...) again throws an error", ->
        should -> testedPromise.setError expectedError
          .throw "error already set"
      it "calling .reject(error) throws an error", ->
        should -> testedPromise.reject expectedError
          .throw "error already set"
      it "calling .rejectOne(error) throws an error", ->
        should -> testedPromise.rejectOne expectedError
          .throw "error already set"
      it "calling .setError(...) throws an error", ->
        should -> testedPromise.setResult {}
          .throw "trying to set result on a promise with error already set"
      it "calling .resolve() throws an error", ->
        should () -> testedPromise.resolve()
          .throw "trying to resolve a promise containing error"
      it "calling .resolveOne() throws an error", ->
        should () -> testedPromise.resolveOne()
          .throw "trying to resolve a promise containing error"

      it "calling .reject() does not throw", ->
        testedPromise.reject()
        testedPromise.then(
          -> throw new Error "expected rejection"
          (error) -> error.should.eql expectedError
        )
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

      it "calling .resolveOne() and .then() resolves the promise", ->
        testedPromise.resolveOne().resolveOne()
        testedPromise.then (result) -> (should result).equal expectedResult
      it "calling .resolve() and .then() resolves the promise", ->
        testedPromise.resolve()
        testedPromise.then (result) -> (should result).equal expectedResult

    describe "when without calling .setResult()", ->
      expectedResult = undefined

      it "calling .resolveOne() and .then() resolves the promise", ->
        testedPromise.resolveOne().resolveOne()
        testedPromise.then (result) -> (should result).equal expectedResult
      it "calling .resolve() and .then() resolves the promise", ->
        testedPromise.resolve()
        testedPromise.then (result) -> (should result).equal expectedResult

class LoggingProxyHandler
  constructor: ->
    @indent = 0

  construct: (Target, args) ->
    @log Target, "construct".yellow, "#{Target.name}(#{(args.map stringifyArg).join ", " })"
    @indent += 1
    try
      instance = new Target
      proxy = new Proxy instance, @
    catch e
      @log Target, "throw".red, stringifyArg e
      @indent -= 1
      throw e
    @log Target, "return".green, stringifyArg instance
    @indent -= 1
    proxy
  apply: (target, thisArg, args) ->
    @log target, "call".yellow, "#{target.name}(#{(args.map stringifyArg).join ", " })"
    @indent += 1
    try
      result = target.apply thisArg, args
    catch e
      @log target, "throw".red, stringifyArg e
      @indent -= 1
      throw e
    @log target, "return".green, stringifyArg result
    @indent -= 1
    result
  get: (target, property, receiver) ->
    try
      value = target[property]
      if property in ["id", "nextPromise"]
        return value
      @log target, "get".blue, "#{property} -> #{stringifyArg value}"
      if typeof value is "function"
        value.id = target.id
        new Proxy value, @
      else
        value
    catch e
      @log target, "get".red, "#{property} -> throw #{stringifyArg e}"
      throw e
  set: (target, property, value, receiver) ->
    try
      previous = target[property]
      @log target, "set".magenta, "#{property} = #{stringifyArg value}"
      if property is "nextPromise"
        value = new Proxy value, @
      target[property] = value
      true
    catch e
      @log target, "set".red, "#{property} = #{stringify value} -> throw #{stringifyArg e}"
      throw e
  log: (target, operation, args) ->
    console.log "#{@printIndent()}#{if target.id then "##{target.id} ".gray else ""}#{operation} #{if args then args.gray else ""}"
  printIndent: ->
    "                                                             ".substring 0, @indent * 2

RawFakePromise = FakePromise

stringifyArg = (arg) ->
  if arg instanceof RawFakePromise
    "FakePromise##{arg.id}"
  else if arg instanceof Error
    "#{arg.name}(#{JSON.stringify arg.message})"
  else if typeof arg is "function"
    "function #{arg.name or "unnamed"}"
  else
    JSON.stringify arg

if process.env.hasOwnProperty "DEBUG"
  # enable crazy debug logs
  FakePromise = new Proxy RawFakePromise, new LoggingProxyHandler RawFakePromise

