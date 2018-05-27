
/**
 * @author Maciej Chałapuk (maciej@chalapuk.pl)
 */
export class FakePromise<T> implements Promise<T> {
  private onfulfilled ?: ((value: T) => any) | null;
  private onrejected ?: ((reason: any) => any) | null;

  private nextPromise ?: FakePromise<any>;

  private result : T | Promise<T>;
  private error : any;

  private resultPromised = false;
  private resultSet = false;
  private errorSet = false;
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

    return this.maybeFinishResolving();
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult> {
    check(!this.specified, 'promise already specified');

    this.onrejected = onrejected;
    this.specified = true;

    return this.maybeFinishResolving();
  }

  setResult(result : T | Promise<T>) {
    check(!this.errorSet, 'trying to set result on a promise with error already set');
    check(!this.resultSet, 'result already set');
    check(!this.resultPromised, 'result already set (waiting for promise)');

    if (isPromise(result)) {
      this.resultPromised = true;
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

    this.maybeFinishResolving();
  }

  setError(error : any) {
    check(!this.resultSet, 'trying to set error on a promise with result already set');
    check(!this.errorSet, 'error already set');
    check(!this.resultPromised, 'result already set (waiting for promise)');
    check(error !== undefined && error !== null, 'error must not be undefined nor null');

    this.errorSet = true;
    this.error = error;

    this.maybeFinishResolving();
  }

  resolve<TResult = never>(result ?: T | Promise<T>) : FakePromise<TResult> {
    check(!this.errorSet, 'trying to resolve a promise containing error');

    if (result !== undefined) {
      this.setResult(result);
    }
    this.markResolved();
    return this.maybeFinishResolving() ;
  }

  reject<TResult = never>(error ?: any) : FakePromise<TResult> {
    check(!this.resultSet, 'trying to reject a promise containing result');

    if (error !== undefined) {
      this.setError(error);
    }
    this.markRejected();
    return this.maybeFinishResolving();
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
    check(this.resultSet, 'trying to resolve a promise without result');

    const next = this.getNextPromise();

    if (!hasValue(this.onfulfilled)) {
      // just forward
      next.setResult(this.result);
      return next;
    }

    const callback = this.onfulfilled as (arg : T) => any;
    return this.executeAndSetNextResult(callback, this.result);
  }

  private doReject() {
    check(this.errorSet, 'trying to reject a promise without error');

    if (!hasValue(this.onrejected)) {
      // just forward
      const next = this.getNextPromise();
      next.setError(this.error);
      return next;
    }

    const callback = this.onrejected as (arg : any) => any;
    return this.executeAndSetNextResult(callback, this.error);
  }

  private executeAndSetNextResult(callback : (arg : any) => any, arg : any) {
    const next = this.getNextPromise();

    try {
      next.setResult(callback(arg as any));
    } catch (e) {
      next.setError(e);
    }
    return next;
  }

  private maybeFinishResolving() {
    if (!this.specified || !(this.resolved || this.rejected)) {
      return this.getNextPromise();
    }
    if (this.resultSet) {
      return this.doResolve();
    }
    return this.doReject();
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

