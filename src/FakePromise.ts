
let nextId = 0;
const SPACES = '                                                              ';

/**
 * @author Maciej Chałapuk (maciej@chalapuk.pl)
 */
export class FakePromise<T> implements Promise<T> {
  /**
   * @param result with which returned promise will be resolved
   * @return new resolved promise
   * @post .setError(), .setResult(), .resolve() and .reject() can not be called on returned promise
   */
  static resolve<T = void>(result ?: Promise<T> | T) : FakePromise<T> {
    const promise = new FakePromise<T>();
    promise.resolve(result);
    return promise;
  }

  /**
   * @param error error with which returned promise will be rejected
   * @return new rejected promise
   * @post .setError(), .setResult(), .resolve() and .reject() can not be called on returned promise
   */
  static reject<T = void>(error : any) : FakePromise<T> {
    const promise = new FakePromise<T>();
    promise.reject(error);
    return promise;
  }

  private onfulfilled ?: ((value: T) => any) | null;
  private onrejected ?: ((reason: any) => any) | null;

  private nextPromise ?: FakePromise<any>;

  private result : T | Promise<T>;
  private error : any;

  private id = nextId++;

  private isChained = false;
  private resultPromised = false;
  private resolveChain = false;
  private resultSet = false;
  private errorSet = false;
  private specified = false;
  private resolved = false;
  private rejected = false;

  private _promiseTrace : string;
  private _resultTrace : string;
  private _errorTrace : string;
  private _specifyTrace : string;
  private _resolveTrace : string;
  private _rejectTrace : string;

  // intended for printing with console.log
  get promiseTrace() : string { return this._promiseTrace; }
  get resultTrace() : string { return this._resultTrace; }
  get errorTrace() : string { return this._errorTrace; }
  get specifyTrace() : string { return this._specifyTrace; }
  get resolveTrace() : string { return this._resolveTrace; }
  get rejectTrace() : string { return this._rejectTrace; }

  readonly [Symbol.toStringTag]: "promise";

  then<TResult1 = T, TResult2 = never>(
    onfulfilled ?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected ?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    this.check(!this.specified, 'promise already specified', this._specifyTrace);

    this.onfulfilled = onfulfilled;
    this.onrejected = onrejected;
    this.specified = true;
    this._specifyTrace = this.trace('specification');

    return this.maybeFinishResolving();
  }

  catch<TResult = never>(
    onrejected ?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.then<T, TResult>(undefined, onrejected);
  }

  finally(onfinally ?: (() => void) | null): Promise<T> {
    const callback = onfinally || noop;

    // Declaration in TypeScript library file is wrong. This method should
    // return Promise<void>. Casting to any in order to satisfy the interface.
    return this.then(callback, callback) as any;
  }

  /**
   * @param result with which promise will be resolved
   * @pre promise is not rejected or resolved
   * @post promise is resolved
   */
  resolve(result ?: T | Promise<T>) : void {
    this.markResolveChain();
    this.resolveOne(result);
  }

  /**
   * @param error error with which promise will be rejected
   * @pre promise is not rejected or resolved
   * @pre given error is not undefined nor null or .setError(error) was called before
   * @post promise is rejected
   */
  reject(error ?: any) : void {
    this.markResolveChain();
    this.rejectOne(error);
  }

  /**
   * @param result with which promise will be resolved
   * @pre promise is not rejected or resolved
   * @pre .setResult() was not called
   * @post .setResult() can not be called
   * @post .resolve() and .resolveOne() can not be called with result argument
   */
  setResult(result : T | Promise<T>) : void {
    this.check(
      !this.isChained,
      "result musn't be programmatically set in a chained promise",
    );
    this._setResult(result);
  }

  /**
   * @param error error with which promise will be rejected
   * @pre given error is not null nor undefined
   * @pre .setError(error) was not called before
   * @pre promise is not already resolved (or rejected)
   * @post .reject() and .rejectOne() can be called without argument
   * @post .setError(), .setResult(), .resolve() and .resolveOne() can not be called
   */
  setError(error : any) : void {
    this.check(
      !this.isChained,
      "error musn't be programmatically set in a chained promise",
    );
    this._setError(error);
  }

  /**
   * @param result with which promise will be resolved
   * @return next promise in the chain (not resolved nor rejected)
   * @pre promise is not rejected or resolved
   * @post promise is resolved
   */
  resolveOne<TResult = never>(result ?: T | Promise<T>) : FakePromise<TResult> {
    this.check(
      !this.errorSet,
      'trying to resolve a promise containing error',
      this._errorTrace,
    );

    if (this.isChained) {
      this.check(
        result === undefined,
        "result musn't be programmatically set in a chained promise",
      );
    } else if (result !== undefined || !this.resultSet) {
      this._setResult(result as T);
    }

    this.markResolved();
    return this.maybeFinishResolving();
  }

  /**
   * @param error error with which promise will be rejected
   * @return next promise in the chain (not resolved nor rejected)
   * @pre promise is not rejected or resolved
   * @pre given error is not undefined nor null or .setError(error) was called before
   * @post promise is rejected
   */
  rejectOne<TResult = never>(error ?: any) : FakePromise<TResult> {
    this.check(
      !this.resultSet,
      'trying to reject a promise containing result',
      this._resultTrace,
    );

    if (this.isChained) {
      this.check(
        error === undefined,
        "error musn't be programmatically set in a chained promise",
      );
    } else if (error !== undefined || !this.errorSet) {
      this._setError(error);
    }

    this.markRejected();
    return this.maybeFinishResolving();
  }

  toJSON() : any {
    const { id, resultPromised, resolveChain, resultSet, errorSet, specified, resolved, rejected } = this;
    return { id, resultPromised, resolveChain, resultSet, errorSet, specified, resolved, rejected } as any;
  }

  toString(indent ?: number) : string {
    const flags = this.toJSON();
    const keys = Object.keys(flags)
      .filter(key => key !== 'id')
      .filter(key => flags[key])
    ;

    if (!indent) {
      const stringifiedFlags = keys.map(key => `${key}: ${flags[key]}`);
      return `FakePromise#${this.id}{${stringifiedFlags.join(',')}}`;
    }

    const prefix = SPACES.substring(0, indent);
    const stringifiedFlags = keys.map(key => `${prefix}  ${key}: ${flags[key]},\n`);
    return `${prefix}FakePromise#${this.id} {\n${stringifiedFlags.join('')}${prefix}}`;
  }

  private _setResult(result : T | Promise<T>) : void {
    this.check(
      !this.errorSet,
      'trying to set result on a promise with error already set',
      this._errorTrace,
    );
    this.check(
      !this.resultSet,
      'result already set',
      this._resultTrace,
    );
    this.check(
      !this.resultPromised,
      'result already set (waiting for promise)',
      this._promiseTrace,
    );

    if (isPromise(result)) {
      this.resultPromised = true;
      this._promiseTrace = this.trace('setting promise as a result');

      result.then(
        result => {
          this.resultPromised = false;
          this._setResult(result);
        },
        error => {
          this.resultPromised = false;
          this._setError(error);
        },
      );
      return;
    }

    this.resultSet = true;
    this.result = result;
    this._resultTrace = this.trace('setting result');

    this.maybeFinishResolving();
  }

  private _setError(error : any) : void {
    this.check(
      !this.resultSet,
      'trying to set error on a promise with result already set',
      this._resultTrace,
    );
    this.check(
      !this.errorSet,
      'error already set',
      this._errorTrace,
    );
    this.check(
      !this.resultPromised,
      'result already set (waiting for promise)',
      this._promiseTrace,
    );
    this.check(
      hasValue(error),
      'error must not be undefined nor null',
    );

    this.errorSet = true;
    this.error = error;
    this._errorTrace = this.trace('setting error');

    this.maybeFinishResolving();
  }

  private markResolveChain() {
    this.resolveChain = true;
  }

  private markResolved() {
    this.check(!this.resolved, 'promise already resolved', this._resolveTrace);
    this.check(!this.rejected, 'promise already rejected', this._rejectTrace);

    this.resolved = true;
    this._resolveTrace = this.trace('resolve');
  }

  private markRejected() {
    this.check(!this.resolved, 'promise already resolved', this._resolveTrace);
    this.check(!this.rejected, 'promise already rejected', this._rejectTrace);

    this.rejected = true;
    this._rejectTrace = this.trace('reject');
  }

  private maybeFinishResolving() {
    if (
      !this.specified
      || !(this.resolved || this.rejected)
      || this.resultPromised
    ) {
      return this.getNextPromise();
    }
    if (this.errorSet) {
      return this.doReject();
    }
    if (this.resultSet) {
      return this.doResolve();
    }
    return this.getNextPromise();
  }

  private doResolve() {
    if (!hasValue(this.onfulfilled)) {
      // just forward
      return this.setNextResult(this.result);
    }
    const callback = this.onfulfilled as (arg : T) => any;
    return this.executeAndSetNextResult(callback, this.result);
  }

  private doReject() {
    if (!hasValue(this.onrejected)) {
      // just forward
      return this.setNextError(this.error);
    }
    const callback = this.onrejected as (arg : any) => any;
    return this.executeAndSetNextResult(callback, this.error);
  }

  private executeAndSetNextResult(callback : (arg : any) => any, arg : any) {
    try {
      return this.setNextResult(callback(arg as any));
    } catch (e) {
      if (e.name === 'FakePromiseError') {
        throw e;
      }
      return this.setNextError(e);
    }
  }

  private setNextResult(result : any) {
    const next = this.getNextPromise();
    next._setResult(result);
    if (this.resolveChain) {
      next.resolve();
    }
    return next;
  }

  private setNextError(error : any) {
    const next = this.getNextPromise();
    next._setError(error);
    if (this.resolveChain) {
      next.reject();
    }
    return next;
  }

  private getNextPromise() {
    if (!this.nextPromise) {
      this.nextPromise = new FakePromise<any>();
      this.nextPromise.isChained = true;
    }
    return this.nextPromise;
  }

  private check(condition : boolean, message : string, stacktrace ?: string) {
    if (!condition) {
      const formattedState = `\n    CURRENT STATE:\n${this.toString(6)}`;
      const error = new Error(`${message}${formattedState}${stacktrace ? stacktrace : ''}`);
      error.name = 'FakePromiseError';
      throw error;
    }
  }

  private trace(name : string) {
    const stateTitle = `state after ${name}`.toUpperCase();
    const formattedState = `    ${stateTitle}:\n${this.toString(6)}`;

    const error = new Error('error');
    const stack = error.stack as string;
    const traceTitle = `stacktrace of ${name}`.toUpperCase();
    const firstNewline = stack.indexOf('\n');
    const secondNewline = stack.indexOf('\n', firstNewline + 1);
    const formattedStack = `  ${traceTitle}:${stack.substring(secondNewline)}\n  EOS`
      .split('\n')
      .map(line => `  ${line}`)
      .join('\n')
    ;

    return `\n${formattedState}\n${formattedStack}`;
  }
}

export default FakePromise;

function hasValue(arg : any | null | undefined) {
  return (arg !== null && arg !== undefined);
}

function isPromise<T>(arg : T | Promise<T>): arg is Promise<T> {
  return hasValue(arg) && typeof (arg as any).then === 'function';
}

function noop() {}

