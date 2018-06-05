
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

  private resultPromised = false;
  private resolveChain = false;
  private resultSet = false;
  private errorSet = false;
  private specified = false;
  private resolved = false;
  private rejected = false;

  private promiseTrace : string;
  private resultTrace : string;
  private errorTrace : string;
  private specifyTrace : string;
  private resolveTrace : string;
  private rejectTrace : string;

  then<TResult1 = T, TResult2 = never>(
    onfulfilled ?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected ?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    this.check(!this.specified, 'promise already specified', this.specifyTrace);

    this.onfulfilled = onfulfilled;
    this.onrejected = onrejected;
    this.specified = true;
    this.specifyTrace = this.trace('specification');

    return this.maybeFinishResolving();
  }

  catch<TResult = never>(
    onrejected ?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.then<T, TResult>(undefined, onrejected);
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
      !this.errorSet,
      'trying to set result on a promise with error already set',
      this.errorTrace,
    );
    this.check(
      !this.resultSet,
      'result already set',
      this.resultTrace,
    );
    this.check(
      !this.resultPromised,
      'result already set (waiting for promise)',
      this.promiseTrace,
    );

    if (isPromise(result)) {
      this.resultPromised = true;
      this.promiseTrace = this.trace('setting promise as a result');

      result.then(
        result => {
          this.resultPromised = false;
          this.setResult(result);
        },
        error => {
          this.resultPromised = false;
          this.setError(error);
        },
      );
      return;
    }

    this.resultSet = true;
    this.result = result;
    this.resultTrace = this.trace('setting result');

    this.maybeFinishResolving();
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
      !this.resultSet,
      'trying to set error on a promise with result already set',
      this.resultTrace,
    );
    this.check(
      !this.errorSet,
      'error already set',
      this.errorTrace,
    );
    this.check(
      !this.resultPromised,
      'result already set (waiting for promise)',
      this.promiseTrace,
    );
    this.check(
      hasValue(error),
      'error must not be undefined nor null',
    );

    this.errorSet = true;
    this.error = error;
    this.errorTrace = this.trace('setting error');

    this.maybeFinishResolving();
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
      this.errorTrace,
    );

    if (result !== undefined) {
      this.setResult(result);
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
      this.resultTrace,
    );

    if (error !== undefined) {
      this.setError(error);
    }
    this.check(this.errorSet, 'error must not be undefined nor null');

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

  private markResolveChain() {
    this.resolveChain = true;
  }

  private markResolved() {
    this.check(!this.resolved, 'promise already resolved', this.resolveTrace);
    this.check(!this.rejected, 'promise already rejected', this.rejectTrace);

    this.resolved = true;
    this.resolveTrace = this.trace('resolve');
  }

  private markRejected() {
    this.check(!this.resolved, 'promise already resolved', this.resolveTrace);
    this.check(!this.rejected, 'promise already rejected', this.rejectTrace);

    this.rejected = true;
    this.rejectTrace = this.trace('reject');
  }

  private maybeFinishResolving() {
    if (!this.specified || !(this.resolved || this.rejected)) {
      return this.getNextPromise();
    }
    if (this.errorSet) {
      return this.doReject();
    }
    // TRADEOFF: Resolving even if this.resultSet is false.
    //
    // Upsides:
    // * Calling .resolve() without result argument and without
    //  previously calling .setResult(undefined) is possible.
    //
    // Downsides:
    // * This.result may be undefined at this point
    //  which may not be compatible with T.
    // * Setting result after calling .resolve() is possible but only
    //  before the promise is specified (.then() or .catch() is called).
    return this.doResolve();
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
      return this.setNextError(e);
    }
  }

  private setNextResult(result : any) {
    const next = this.getNextPromise();
    if (this.resolveChain) {
      next.resolve(result);
    } else {
      next.setResult(result);
    }
    return next;
  }

  private setNextError(error : any) {
    const next = this.getNextPromise();
    if (this.resolveChain) {
      next.reject(error);
    } else {
      next.setError(error);
    }
    return next;
  }

  private getNextPromise() {
    if (!this.nextPromise) {
      this.nextPromise = new FakePromise<any>();
    }
    return this.nextPromise;
  }

  private check(condition : boolean, message : string, stacktrace ?: string) {
    if (!condition) {
      const formattedState = `\n    CURRENT STATE:\n${this.toString(6)}`;
      throw new Error(`${message}${formattedState}${stacktrace ? stacktrace : ''}`);
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

