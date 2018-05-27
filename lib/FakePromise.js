"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let nextId = 0;
class FakePromise {
    constructor() {
        this.id = nextId++;
        this.resultPromised = false;
        this.resolveChain = false;
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
        return this.maybeFinishResolving();
    }
    catch(onrejected) {
        check(!this.specified, 'promise already specified');
        this.onrejected = onrejected;
        this.specified = true;
        return this.maybeFinishResolving();
    }
    resolve(result) {
        this.markResolveChain();
        this.resolveOne(result);
    }
    reject(error) {
        this.markResolveChain();
        this.rejectOne(error);
    }
    setResult(result) {
        check(!this.errorSet, 'trying to set result on a promise with error already set');
        check(!this.resultSet, 'result already set');
        check(!this.resultPromised, 'result already set (waiting for promise)');
        if (isPromise(result)) {
            this.resultPromised = true;
            result.then(result => {
                this.resultPromised = false;
                this.setResult(result);
            }, error => {
                this.resultPromised = false;
                this.setError(error);
            });
            return;
        }
        this.resultSet = true;
        this.result = result;
        this.maybeFinishResolving();
    }
    setError(error) {
        check(!this.resultSet, 'trying to set error on a promise with result already set');
        check(!this.errorSet, 'error already set');
        check(!this.resultPromised, 'result already set (waiting for promise)');
        check(error !== undefined && error !== null, 'error must not be undefined nor null');
        this.errorSet = true;
        this.error = error;
        this.maybeFinishResolving();
    }
    resolveOne(result) {
        check(!this.errorSet, 'trying to resolve a promise containing error');
        if (result !== undefined) {
            this.setResult(result);
        }
        this.markResolved();
        return this.maybeFinishResolving();
    }
    rejectOne(error) {
        check(!this.resultSet, 'trying to reject a promise containing result');
        if (error !== undefined) {
            this.setError(error);
        }
        this.markRejected();
        return this.maybeFinishResolving();
    }
    toJSON() {
        const { resultPromised, resolveChain, resultSet, errorSet, specified, resolved, rejected } = this;
        return { resultPromised, resolveChain, resultSet, errorSet, specified, resolved, rejected };
    }
    toString() {
        const flags = this.toJSON();
        const flagsString = Object.keys(flags)
            .map(key => `${key}=${flags[key]}`)
            .join(',');
        return `FakePromise#${this.id}{${flagsString}}`;
    }
    markResolveChain() {
        this.resolveChain = true;
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
    maybeFinishResolving() {
        if (!this.specified || !(this.resolved || this.rejected)) {
            return this.getNextPromise();
        }
        if (this.resultSet) {
            return this.doResolve();
        }
        return this.doReject();
    }
    doResolve() {
        check(this.resultSet, 'trying to resolve a promise without result');
        if (!hasValue(this.onfulfilled)) {
            return this.setNextResult(this.result);
        }
        const callback = this.onfulfilled;
        return this.executeAndSetNextResult(callback, this.result);
    }
    doReject() {
        check(this.errorSet, 'trying to reject a promise without error');
        if (!hasValue(this.onrejected)) {
            return this.setNextError(this.error);
        }
        const callback = this.onrejected;
        return this.executeAndSetNextResult(callback, this.error);
    }
    executeAndSetNextResult(callback, arg) {
        try {
            return this.setNextResult(callback(arg));
        }
        catch (e) {
            return this.setNextError(e);
        }
    }
    setNextResult(result) {
        const next = this.getNextPromise();
        if (this.resolveChain) {
            next.resolve(result);
        }
        else {
            next.setResult(result);
        }
        return next;
    }
    setNextError(error) {
        const next = this.getNextPromise();
        if (this.resolveChain) {
            next.reject(error);
        }
        else {
            next.setError(error);
        }
        return next;
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