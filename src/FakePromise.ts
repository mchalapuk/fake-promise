
interface Callback<T> {
  (result : T) : void;
}

/**
 * @author Maciej Chałapuk (maciej@chalapuk.pl)
 */
export class FakePromise<T> implements Promise<T> {
  private onResolved ?: Callback<T>;
  private onRejected ?: Callback<any>;

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    if (onfulfilled && onrejected) {
      return new Promise<TResult1 | TResult2>((resolve, reject) => {
        this.onResolved = result => resolve(onfulfilled(result));
        this.onRejected = error => reject(onrejected(error));
      });
    }
    if (onfulfilled) {
      return new Promise<TResult1 | TResult2>((resolve, reject) => {
        this.onResolved = result => resolve(onfulfilled(result));
        this.onRejected = error => reject(error);
      });
    }

    throw new Error('not supported');
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult> {
    if (onrejected) {
      return new Promise<T | TResult>((resolve, reject) => {
        this.onRejected = error => reject(onrejected(error));
      });
    }

    throw new Error('not supported');
  }

  resolve(result : T) {
    check(
      this.onResolved !== undefined,
      '.resolve(...) called without .then(...) callback specified'
    );
    (this.onResolved as Callback<T>)(result);
  }
  reject(error : any) {
    check(
      this.onRejected !== undefined,
      '.reject(...) called without .then(...) callback specified'
    );
    (this.onRejected as Callback<any>)(error);
  }
}

function check(condition : boolean, message : string) {
  if (!condition) {
    throw new Error(message);
  }
}

export default FakePromise;

