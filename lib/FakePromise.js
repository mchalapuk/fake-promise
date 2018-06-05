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
    static resolve(result) {
        const promise = new FakePromise();
        promise.resolve(result);
        return promise;
    }
    static reject(error) {
        const promise = new FakePromise();
        promise.reject(error);
        return promise;
    }
    then(onfulfilled, onrejected) {
        check(!this.specified, 'promise already specified', this.specifyTrace);
        this.onfulfilled = onfulfilled;
        this.onrejected = onrejected;
        this.specified = true;
        this.specifyTrace = trace('specification');
        return this.maybeFinishResolving();
    }
    catch(onrejected) {
        return this.then(undefined, onrejected);
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
        check(!this.errorSet, 'trying to set result on a promise with error already set', this.errorTrace);
        check(!this.resultSet, 'result already set', this.resultTrace);
        check(!this.resultPromised, 'result already set (waiting for promise)', this.promiseTrace);
        if (isPromise(result)) {
            this.resultPromised = true;
            this.promiseTrace = trace('setting promise as a result');
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
        this.resultTrace = trace('setting result');
        this.maybeFinishResolving();
    }
    setError(error) {
        check(!this.resultSet, 'trying to set error on a promise with result already set', this.resultTrace);
        check(!this.errorSet, 'error already set', this.errorTrace);
        check(!this.resultPromised, 'result already set (waiting for promise)', this.promiseTrace);
        check(hasValue(error), 'error must not be undefined nor null');
        this.errorSet = true;
        this.error = error;
        this.errorTrace = trace('setting error');
        this.maybeFinishResolving();
    }
    resolveOne(result) {
        check(!this.errorSet, 'trying to resolve a promise containing error', this.errorTrace);
        if (result !== undefined) {
            this.setResult(result);
        }
        this.markResolved();
        return this.maybeFinishResolving();
    }
    rejectOne(error) {
        check(!this.resultSet, 'trying to reject a promise containing result', this.resultTrace);
        if (error !== undefined) {
            this.setError(error);
        }
        check(this.errorSet, 'error must not be undefined nor null');
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
        check(!this.resolved, 'promise already resolved', this.resolveTrace);
        check(!this.rejected, 'promise already rejected', this.rejectTrace);
        this.resolved = true;
        this.resolveTrace = trace('resolve');
    }
    markRejected() {
        check(!this.resolved, 'promise already resolved', this.resolveTrace);
        check(!this.rejected, 'promise already rejected', this.rejectTrace);
        this.rejected = true;
        this.rejectTrace = trace('reject');
    }
    maybeFinishResolving() {
        if (!this.specified || !(this.resolved || this.rejected)) {
            return this.getNextPromise();
        }
        if (this.errorSet) {
            return this.doReject();
        }
        return this.doResolve();
    }
    doResolve() {
        if (!hasValue(this.onfulfilled)) {
            return this.setNextResult(this.result);
        }
        const callback = this.onfulfilled;
        return this.executeAndSetNextResult(callback, this.result);
    }
    doReject() {
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
function check(condition, message, stacktrace) {
    if (!condition) {
        throw new Error(`${message}${stacktrace ? stacktrace : ''}`);
    }
}
function hasValue(arg) {
    return (arg !== null && arg !== undefined);
}
function isPromise(arg) {
    return hasValue(arg) && typeof arg.then === 'function';
}
function trace(name) {
    const error = new Error('error');
    const stack = error.stack;
    const title = `stacktrace of ${name}`.toUpperCase();
    const firstNewline = stack.indexOf('\n');
    const secondNewline = stack.indexOf('\n', firstNewline + 1);
    return `\n  ${title}:${stack.substring(secondNewline)}\n  EOS`
        .split('\n')
        .map(line => `  ${line}`)
        .join('\n');
}
//# sourceMappingURL=FakePromise.js.map