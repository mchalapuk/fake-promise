"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FakePromise {
    then(onfulfilled, onrejected) {
        if (onfulfilled && onrejected) {
            return new Promise((resolve, reject) => {
                this.onResolved = result => resolve(onfulfilled(result));
                this.onRejected = error => reject(onrejected(error));
            });
        }
        if (onfulfilled) {
            return new Promise((resolve, reject) => {
                this.onResolved = result => resolve(onfulfilled(result));
                this.onRejected = error => reject(error);
            });
        }
        throw new Error('not supported');
    }
    catch(onrejected) {
        if (onrejected) {
            return new Promise((resolve, reject) => {
                this.onRejected = error => reject(onrejected(error));
            });
        }
        throw new Error('not supported');
    }
    resolve(result) {
        check(this.onResolved !== undefined, '.resolve(...) called without .then(...) callback specified');
        this.onResolved(result);
    }
    reject(error) {
        check(this.onRejected !== undefined, '.reject(...) called without .then(...) callback specified');
        this.onRejected(error);
    }
}
exports.FakePromise = FakePromise;
function check(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
exports.default = FakePromise;
//# sourceMappingURL=FakePromise.js.map