"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FakePromise {
    constructor() {
        this.resultSet = false;
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
    setResult(resultOrPromise) {
        check(!this.resultSet, 'result already set');
        this.resultSet = true;
        if (isPromise(resultOrPromise)) {
            resultOrPromise.then(result => this.result = result, error => this.error = error);
        }
        else {
            this.result = resultOrPromise;
        }
        return this;
    }
    setError(error) {
        check(!this.resultSet, 'result already set');
        this.resultSet = true;
        this.error = error;
        return this;
    }
    resolve(resultOrPromise) {
        if (resultOrPromise !== undefined) {
            if (isPromise(resultOrPromise)) {
                resultOrPromise.then(result => this.resolve(result), error => this.reject(error));
                return this.getNextPromise();
            }
            this.setResult(resultOrPromise);
        }
        this.markResolved();
        if (this.specified) {
            this.doResolve();
        }
        return this.getNextPromise();
    }
    reject(error) {
        if (error !== undefined) {
            this.setError(error);
        }
        this.markRejected();
        if (this.specified) {
            this.doReject();
        }
        return this.getNextPromise();
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
        if (!hasValue(this.onfulfilled)) {
            return this.getNextPromise().setResult(this.result);
        }
        const callback = this.onfulfilled;
        return this.executeAndSetNextResult(callback, this.result);
    }
    doReject() {
        if (!hasValue(this.onrejected)) {
            return this.getNextPromise().setError(this.error);
        }
        const callback = this.onrejected;
        return this.executeAndSetNextResult(callback, this.error);
    }
    executeAndSetNextResult(callback, arg) {
        const next = this.getNextPromise();
        try {
            return next.setResult(callback(arg));
        }
        catch (e) {
            return next.setError(e);
        }
    }
    maybeFinishResolving() {
        if (this.resolved) {
            this.doResolve();
            return;
        }
        if (this.rejected) {
            this.doReject();
            return;
        }
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