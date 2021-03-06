# FakePromise :pray:

[<img src="https://badge.fury.io/js/fake-promise.svg" alt="Current Version">][npm-status]
[<img src="https://travis-ci.org/mchalapuk/fake-promise.svg?branch=master" alt="Build Status" />][travis-status]
[<img src="https://david-dm.org/mchalapuk/fake-promise/status.svg" alt="Dependencies">][david-status]
[<img src="https://david-dm.org/mchalapuk/fake-promise/dev-status.svg" alt="DevDependencies" align="right" />][david-status-dev]

[npm-status]: https://npmjs.org/package/fake-promise
[travis-status]: https://travis-ci.org/mchalapuk/fake-promise
[david-status]: https://david-dm.org/mchalapuk/fake-promise
[david-status-dev]: https://david-dm.org/mchalapuk/fake-promise?type=dev

> Total control over WHEN [ES6 promises][mdn-promise] are resolved or rejected.

[mdn-promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

## Why would I want it?

* FakePromise is a single-class library without any run-time dependencies,
* It provides a **fully functional implementation of Promise with additional testing utilities**,
* Fine grained control of resolution of each promise in a chain (`.then(...).then(...)`),
* Thoroughly unit-tested and field-tested in several commercial projects,
* Usable in modern JavaScript, TypeScript and CoffeeScript.

This package is intended for use in unit tests. For production, please use [Bluebird][bluebird].

[bluebird]: https://github.com/petkaantonov/bluebird

## Installation

```shell
npm install --save-dev fake-promise
```

## Loading

```javascript
// node-style require
const { FakePromise } = require('fake-promise');

// es6-style default import
import FakePromise from 'fake-promise';
```

## Documentation

For full documentation, please see JSDoc comments in [FakePromise][FakePromise] class.

[FakePromise]: /src/FakePromise.ts

```javascript
/**
 * TL; DR
 */
export class FakePromise<T> implements Promise<T> {
  // create already resolved/rejected instances of FakePromise (will resolve whole chain)
  static resolve<U = void>(result ?: U | Promise<U>) : FakePromise<U>;
  static reject<U = void>(error : any) : FakePromise<U>;

  // no-arg constructor (without required executor as in standard promise)
  constructor() {}

  // promise specification methods (standard ES promise interface)
  then<U>(onresolved : Callback<U>, onrejected ?: Callback<any>) : Promise<U>;
  catch(onrejected : Callback<any>) : Promise<any>;
  finally(onfulfilled : Callback<void>) : Promise<void>;

  // resolve/reject full promise chain
  resolve(result ?: T | Promise<T>) : void;
  reject(error ?: any) : void;

  // resolve/reject single promise in a chain and return next promise from the chain
  resolveOne<U = void>(result ?: T | Promise<T>) : FakePromise<U>;
  rejectOne<U = void>(error ?: any) : FakePromise<U>;

  // set result/error of a promise without resolving/rejecting
  // (to call resolve without arguments afterwards)
  setResult(result : T | Promise<T>) : void;
  setError(error : any) : void;
}
```
## (Not So) Minimal Example

```javascript
import FakePromise from 'fake-promise';

/**
 * Async function to be tested.
 *
 * It calls `asyncFunctionDependency`, waits for it's promise
 * to be resolved, and returns the result of resolved promise.
 */
async function testedFunction(asyncFunctionDependency) {
  try {
    const result = await asyncFunctionDependency();
    return result;
  } catch (e) {
    throw e;
  }
}

/**
 * Tests of `testedFunction` using FakePromise.
 */
describe('testedFunction(asyncDependency)', () => {
  let dependencyPromise;
  let asyncDependency;
  let resultPromise;

  beforeEach(() => {
    // program `asyncDependency` to return a fresh instance of FakePromise
    dependencyPromise = new FakePromise();
    asyncDependency = sinon.stub().returns(dependencyPromise);

    resultPromise = testedFunction(asyncDependency);

    // At this point `dependencyPromise` is not yet resolved,
    // so `resultPromise` isn't also.
  });

  describe('when after resolving dependency promise', () => {
    const expectedResult = "result";

    beforeEach(end => {
      // could be also .resolveOne
      dependencyPromise.resolve(expectedResult);

      // At this point `dependencyPromise` is resolved, `resultPromise` is not.
      // `setImmediate` is needed in order to wait single tick
      // for resolution of implicit promise created by `await` keyword.
      // `resultPromise` will be resolved before `end` is called.
      setImmediate(end);
    });

    it('resolves result promise', () => {
      // Returning promise so that the test will fail if promise is rejected.
      return resultPromise.then(result => result.should.eql(expectedResult));
    });
  });

  describe('when after rejecting dependency promise', () => {
    const expectedError = new Error("fail");

    beforeEach(end => {
      // could be also .rejectOne
      dependencyPromise.reject(expectedError);

      // At this point `dependencyPromise` is rejected, `resultPromise` is not.
      // `setImmediate` is needed in order to wait single tick
      // for rejection of implicit promise created by `await` keyword.
      // `resultPromise` will be rejected before `end` is called.
      setImmediate(end);
    });

    it('rejects result promise', () => {
      // Testing rejection is tricky as both resolution and rejection cases
      // must be tested in callbacks of the same promise instance
      // (in single call to `.then(onResolved, onRejected)`).
      return resultPromise.then(
        result => { throw new Error(`expected rejection, got result: ${result}`) },
        err => err.should.eql(expectedError),
      );
    });
  });
});
```

## Debugging Techniques

### Printing Stack Traces

FakePromise stores stack traces of all promise specifications, result
provisions and promise resolutions. When debugging problems with tests,
it may be helpful to `console.log` one or more of stored traces.

```javascript
// print stack trace of call to `.then(...)` or `.catch`
console.log(fakePromise.specifyTrace);

// print stack trace of call to `.resove(...)`
console.log(fakePromise.resolveTrace);

// print stack trace of call to `.reject(...)`
console.log(fakePromise.rejectTrace);

// print stack trace of calls to `.setResult(...)`
console.log(fakePromise.resultTrace);

// print stack trace of calls to `.setResult(Promise)`
console.log(fakePromise.promiseTrace);

// print stack trace of calls to `.setError(...)`
console.log(fakePromise.errorTrace);
```

### Using `.toString()`

FakePromise implements `.toString()` method which provides information about
internal state of FakePromise instance. When encountering problems with
debugging async code, printing used instance of FakePromise may prove helpful.

```javascript
console.log(fakePromise);
```

## License

Copyright &copy; 2017 - 2019 Maciej Chałapuk. Released under [MIT license](LICENSE).

