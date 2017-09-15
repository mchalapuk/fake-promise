
interface Callback<T, U> {
  (result : T) : U | Promise<U>;
}

/**
 * @author Maciej Chałapuk (maciej@chalapuk.pl)
 */
export class FakePromise<T> {

  then<U>(onResolved : Callback<T, U>, onRejected ?: Callback<any, U>) : Promise<U> {
    throw new Error('not implemented');
  }

  resolve(result : T) {
    throw new Error('not implemented');
  }
}

export default FakePromise;

