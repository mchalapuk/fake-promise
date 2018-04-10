"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FakePromise {
    constructor() {
        this.resultSet = false;
        this.specified = false;
        this.resolved = false;
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
        check(!this.resultSet, 'result already set');
        this.result = result;
        this.resultSet = true;
        return this;
    }
    resolve(result) {
        if (result !== undefined) {
            this.setResult(result);
        }
        this.markResolved();
        if (this.specified) {
            this.doResolve();
        }
        return this.getNextPromise();
    }
    setError(error) {
        check(this.error === undefined, 'error already set');
        this.error = error;
        return this;
    }
    reject(error) {
        if (error !== undefined) {
            this.setError(error);
        }
        this.markResolved();
        if (this.specified) {
            this.doReject();
        }
        return this.getNextPromise();
    }
    markResolved() {
        check(!this.resolved, 'promise already resolved');
        this.resolved = true;
    }
    doResolve() {
        const next = this.getNextPromise();
        if (!hasValue(this.onfulfilled)) {
            return next.setResult(this.result);
        }
        const callback = this.onfulfilled;
        try {
            return next.setResult(callback(this.result));
        }
        catch (e) {
            return next.setError(e);
        }
    }
    doReject() {
        const next = this.getNextPromise();
        if (!hasValue(this.onrejected)) {
            return next.setError(this.error);
        }
        const callback = this.onrejected;
        try {
            return next.setResult(callback(this.error));
        }
        catch (e) {
            return next.setError(e);
        }
    }
    maybeFinishResolving() {
        if (!this.resolved) {
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
function check(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function hasValue(arg) {
    return (arg !== null && arg !== undefined);
}
exports.default = FakePromise;
//# sourceMappingURL=FakePromise.js.map