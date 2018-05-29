# fake-promise

[<img src="https://travis-ci.org/mchalapuk/fake-promise.svg?branch=master" alt="Build Status" />][travis-status]
[<img src="https://david-dm.org/mchalapuk/fake-promise/status.svg" alt="Dependencies">][david-status]
[<img src="https://david-dm.org/mchalapuk/fake-promise/dev-status.svg" alt="DevDependencies" align="right" />][david-status-dev]

[travis-status]: https://travis-ci.org/mchalapuk/fake-promise
[david-status]: https://david-dm.org/mchalapuk/fake-promise
[david-status-dev]: https://david-dm.org/mchalapuk/fake-promise?type=dev

> A convenient way to mock [ES6 promises][mdn-promise] when unit testing.

[mdn-promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

## TL; DR

* FakePromise is a single-class library without any run-time dependencies,
* It gives total **control of WHEN the promises are resolved** or rejected,
* Supports full-promise-chain and one-by-one promise resolution,
* Thoroughly unit-tested and field-tested in several commercial projects,
* Usable in modern JavaScript, TypeScript and CoffeeScript.

```javascript
/**
 * A simplified interface of FakePromise.
 */
export class FakePromise<T> {
  // no-arg constructor (without required executor as in standard promise)
  constructor() {}

  // promise specification methods (standard es promise interface)
  then<U>(onresolved : Callback<U>, onrejected ?: Callback<any>) : FakePromise<U>;
  catch(onrejected : Callback<any>) : FakePromise<any>;

  // extra methods provided by FakePromise
  resolve(result ?: T) : void;
  reject(error ?: any) : void;
}
```

## License

Copyright &copy; 2018 Maciej Chałapuk. Released under [MIT license](LICENSE).

