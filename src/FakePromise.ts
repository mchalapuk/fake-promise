
/**
 * @author Maciej Chałapuk (maciej@chalapuk.pl)
 */
export class FakePromise<T> implements Promise<T> {
  private onfulfilled ?: ((value: T) => any) | null;
  private onrejected ?: ((reason: any) => any) | null;

  private nextPromise ?: FakePromise<any>;

  private result : T;
  private error : any;

  private resolved = false;

  then<TResult1 = T, TResult2 = never>(
    onfulfilled ?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected ?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    check(this.nextPromise === undefined, 'promise already specified');

    this.onfulfilled = onfulfilled;
    this.onrejected = onrejected;

    return this.nextPromise = new FakePromise<TResult1 | TResult2>();
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult> {
    check(this.nextPromise === undefined, 'promise already specified');

    this.onrejected = onrejected;

    return this.nextPromise = new FakePromise<T | TResult>();
  }

  setResult(result : T) {
    check(this.result === undefined, 'result already set');
    this.result = result;
    return this;
  }

  resolve(result ?: T) {
    if (result !== undefined) {
      this.setResult(result);
    }

    check(this.result !== undefined, '.resove() called before .setResult(...)');
    this.markResolved();

    const next = this.nextPromise as FakePromise<any>;
    if (!hasValue(this.onfulfilled)) {
      return next.setResult(this.result);
    }

    const callback = this.onfulfilled as (arg : T) => any;
    try {
      return next.setResult(callback(this.result as T));
    } catch (e) {
      return next.setError(e);
    }
  }

  setError(error : any) {
    check(this.error === undefined, 'error already set');
    this.error = error;
    return this;
  }

  reject(error ?: any) {
    if (error !== undefined) {
      this.setError(error);
    }

    check(this.error !== undefined, '.reject() called before .setError(...)');
    this.markResolved();

    const next = this.nextPromise as FakePromise<any>;
    if (!hasValue(this.onrejected)) {
      return next.setError(this.error);
    }

    const callback = this.onrejected as (arg : any) => any;
    try {
      return next.setResult(callback(this.error as any));
    } catch (e) {
      return next.setError(e);
    }
  }

  private markResolved() {
    check(this.nextPromise !== undefined, 'promise not specified');
    check(!this.resolved, 'promise already resolved');

    this.resolved = true;
  }
}

function check(condition : boolean, message : string) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasValue(arg : any | null | undefined) {
  return (arg !== null && arg !== undefined);
}

export default FakePromise;

