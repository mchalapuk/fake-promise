"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FakePromise {
    constructor() {
        this.resultSet = false;
        this.resolved = false;
    }
    then(onfulfilled, onrejected) {
        check(this.nextPromise === undefined, 'promise already specified');
        this.onfulfilled = onfulfilled;
        this.onrejected = onrejected;
        return this.nextPromise = new FakePromise();
    }
    catch(onrejected) {
        check(this.nextPromise === undefined, 'promise already specified');
        this.onrejected = onrejected;
        return this.nextPromise = new FakePromise();
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
        check(this.resultSet, '.resove() called before .setResult(...)');
        this.markResolved();
        const next = this.nextPromise;
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
    setError(error) {
        check(this.error === undefined, 'error already set');
        this.error = error;
        return this;
    }
    reject(error) {
        if (error !== undefined) {
            this.setError(error);
        }
        check(this.error !== undefined, '.reject() called before .setError(...)');
        this.markResolved();
        const next = this.nextPromise;
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
    markResolved() {
        check(this.nextPromise !== undefined, 'promise not specified');
        check(!this.resolved, 'promise already resolved');
        this.resolved = true;
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