
sinon = require "sinon"

FakePromise = require "./FakePromise"
  .default

describe "FakePromise", ->
  testedPromise = null

  beforeEach ->
    testedPromise = new FakePromise

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

