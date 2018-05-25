"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FakePromise {
    constructor() {
        this.resultSet = false;
        this.errorSet = false;
        this.specified = false;
        this.resolved = false;
        this.rejected = false;
    }
    then(onfulfilled, onrejected) {
        check(!this.specified, 'promise already specified');
        this.onfulfilled = onfulfilled;
        this.onrejected = onrejected;
        this.specified = true;
        this.maybeFinishResolving();
        return this.getNextPromise();
    }
    catch(onrejected) {
        check(!this.specified, 'promise already specified');
        this.onrejected = onrejected;
        this.specified = true;
        this.maybeFinishResolving();
        return this.getNextPromise();
    }
    setResult(result) {
        check(!this.errorSet, 'trying to set result on a promise with error already set');
        check(!this.resultSet, 'result already set');
        this.resultSet = true;
        this.result = result;
        this.maybeFinishResolving();
    }
    setError(error) {
        check(!this.resultSet, 'trying to set error on a promise with result already set');
        check(!this.errorSet, 'error already set');
        check(error !== undefined && error !== null, 'error must not be undefined or null');
        this.errorSet = true;
        this.error = error;
        this.maybeFinishResolving();
    }
    resolve(result) {
        check(!this.errorSet, 'trying to resolve a promise containing error');
        this.markResolved();
        const next = this.getNextPromise();
        if (result !== undefined) {
            this.setResult(result);
            return next;
        }
        this.maybeFinishResolving();
        return next;
    }
    reject(error) {
        check(!this.resultSet, 'trying to reject a promise containing result');
        this.markRejected();
        const next = this.getNextPromise();
        if (error !== undefined) {
            this.setError(error);
            return next;
        }
        this.maybeFinishResolving();
        return next;
    }
    markResolved() {
        check(!this.resolved, 'promise already resolved');
        check(!this.rejected, 'promise already rejected');
        this.resolved = true;
    }
    markRejected() {
        check(!this.resolved, 'promise already resolved');
        check(!this.rejected, 'promise already rejected');
        this.rejected = true;
    }
    doResolve() {
        check(this.resultSet, 'trying to resolve a promise without result');
        const next = this.getNextPromise();
        if (!hasValue(this.onfulfilled)) {
            next.setResult(this.result);
            return next;
        }
        if (!isPromise(this.result)) {
            const callback = this.onfulfilled;
            return this.executeAndSetNextResult(callback, this.result);
        }
        this.result.then(result => {
            const callback = this.onfulfilled;
            return this.executeAndSetNextResult(callback, result);
        }, error => {
            if (!hasValue(this.onrejected)) {
                next.setResult(error);
                return next;
            }
            const callback = this.onrejected;
            return this.executeAndSetNextResult(callback, error);
        });
        return next;
    }
    doReject() {
        check(this.errorSet, 'trying to reject a promise without error');
        if (!hasValue(this.onrejected)) {
            const next = this.getNextPromise();
            next.setError(this.error);
            return next;
        }
        const callback = this.onrejected;
        return this.executeAndSetNextResult(callback, this.error);
    }
    executeAndSetNextResult(callback, arg) {
        const next = this.getNextPromise();
        try {
            next.setResult(callback(arg));
        }
        catch (e) {
            next.setError(e);
        }
        return next;
    }
    maybeFinishResolving() {
        if (!this.specified || !(this.resolved || this.rejected)) {
            return;
        }
        if (this.resultSet) {
            this.doResolve();
            return;
        }
        this.doReject();
    }
    getNextPromise() {
        if (!this.nextPromise) {
            this.nextPromise = new FakePromise();
        }
        return this.nextPromise;
    }
}
exports.FakePromise = FakePromise;
exports.default = FakePromise;
function check(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function hasValue(arg) {
    return (arg !== null && arg !== undefined);
}
function isPromise(arg) {
    return hasValue(arg) && typeof arg.then === 'function';
}
//# sourceMappingURL=FakePromise.js.map