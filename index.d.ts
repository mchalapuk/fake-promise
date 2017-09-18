
export class FakePromise<T> implements Promise<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled ?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected ?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult>;

  setResult(result : T) : this;
  resolve(result ?: T) : FakePromise<any>;
  setError(error : any) : this;
  reject(error ?: any) : FakePromise<any>;
}

export default FakePromise;

