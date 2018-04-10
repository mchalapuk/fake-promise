
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

  setResult(result : T) {
    check(!this.resultSet, 'result already set');
    this.result = result;
    this.resultSet = true;
    return this;
  }

  resolve(result ?: T) {
    if (result !== undefined) {
      this.setResult(result);
    }
    this.markResolved();

    if (this.specified) {
      this.doResolve();
    }
    return this.getNextPromise();
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
    this.markResolved();

    if (this.specified) {
      this.doReject();
    }
    return this.getNextPromise();
  }

  private markResolved() {
    check(!this.resolved, 'promise already resolved');
    this.resolved = true;
  }

  private doResolve() {
    const next = this.getNextPromise() as FakePromise<any>;
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

  private doReject() {
    const next = this.getNextPromise() as FakePromise<any>;
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

  private maybeFinishResolving() {
    if (!this.resolved) {
      return
    }
    if (this.resultSet) {
      this.doResolve();
      return;
    }
    this.doReject();
  }

  private getNextPromise() {
    if (!this.nextPromise) {
      this.nextPromise = new FakePromise<any>();
    }
    return this.nextPromise;
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

