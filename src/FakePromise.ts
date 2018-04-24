
/**
 * @author Maciej Chałapuk (maciej@chalapuk.pl)
 */
export class FakePromise<T> implements Promise<T> {
  private onfulfilled ?: ((value: T) => any) | null;
  private onrejected ?: ((reason: any) => any) | null;

  private nextPromise ?: FakePromise<any>;

  private result : T;
  private error : any;

  private resultSet = false;
  private specified = false;
  private resolved = false;
  private rejected = false;

  then<TResult1 = T, TResult2 = never>(
    onfulfilled ?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected ?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    check(!this.specified, 'promise already specified');

    this.onfulfilled = onfulfilled;
    this.onrejected = onrejected;
    this.specified = true;

    this.maybeFinishResolving();
    return this.getNextPromise();
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult> {
    check(!this.specified, 'promise already specified');

    this.onrejected = onrejected;
    this.specified = true;

    this.maybeFinishResolving();
    return this.getNextPromise();
  }

  setResult(resultOrPromise : T | Promise<T>) {
    check(!this.resultSet, 'result already set');
    this.resultSet = true;

    if (isPromise(resultOrPromise)) {
      resultOrPromise.then(
        result => this.result = result,
        error => this.error = error,
      );
    } else {
      this.result = resultOrPromise;
    }
    return this;
  }

  setError(error : any) {
    check(!this.resultSet, 'result already set');
    this.resultSet = true;

    this.error = error;
    return this;
  }

  resolve(resultOrPromise ?: T | Promise<T>) {
    if (resultOrPromise !== undefined) {
      if (isPromise(resultOrPromise)) {
        // In case the result is a promise, we don't know
        // if this is a resolve or reject at this point.
        resultOrPromise.then(
          result => this.resolve(result),
          error => this.reject(error),
        );
        return this.getNextPromise()
      }

      // Result is not a promise. We may safely resolve.
      this.setResult(resultOrPromise);
    }
    this.markResolved();

    if (this.specified) {
      this.doResolve();
    }
    return this.getNextPromise();
  }

  reject(error ?: any) {
    if (error !== undefined) {
      this.setError(error);
    }
    this.markRejected();

    if (this.specified) {
      this.doReject();
    }
    return this.getNextPromise();
  }

  private markResolved() {
    check(!this.resolved, 'promise already resolved');
    check(!this.rejected, 'promise already rejected');
    this.resolved = true;
  }

  private markRejected() {
    check(!this.resolved, 'promise already resolved');
    check(!this.rejected, 'promise already rejected');
    this.rejected = true;
  }

  private doResolve() {
    if (!hasValue(this.onfulfilled)) {
      // just forward
      return this.getNextPromise().setResult(this.result);
    }

    const callback = this.onfulfilled as (arg : T) => any;
    return this.executeAndSetNextResult(callback, this.result);
  }

  private doReject() {
    if (!hasValue(this.onrejected)) {
      // just forward
      return this.getNextPromise().setError(this.error);
    }

    const callback = this.onrejected as (arg : any) => any;
    return this.executeAndSetNextResult(callback, this.error);
  }

  private executeAndSetNextResult(callback : (arg : any) => any, arg : any) {
    const next = this.getNextPromise();

    try {
      return next.setResult(callback(arg as any));
    } catch (e) {
      return next.setError(e);
    }
  }

  private maybeFinishResolving() {
    if (this.resolved) {
      this.doResolve();
      return;
    }
    if (this.rejected) {
      this.doReject();
      return;
    }
  }

  private getNextPromise() {
    if (!this.nextPromise) {
      this.nextPromise = new FakePromise<any>();
    }
    return this.nextPromise;
  }
}

export default FakePromise;

function check(condition : boolean, message : string) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasValue(arg : any | null | undefined) {
  return (arg !== null && arg !== undefined);
}

function isPromise<T>(arg : T | Promise<T>): arg is Promise<T> {
  return hasValue(arg) && typeof (arg as any).then === 'function';
}

