"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let nextId = 0;
const SPACES = '                                                              ';
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
        this.check(!this.specified, 'promise already specified', this.specifyTrace);
        this.onfulfilled = onfulfilled;
        this.onrejected = onrejected;
        this.specified = true;
        this.specifyTrace = this.trace('specification');
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
        this.check(!this.errorSet, 'trying to set result on a promise with error already set', this.errorTrace);
        this.check(!this.resultSet, 'result already set', this.resultTrace);
        this.check(!this.resultPromised, 'result already set (waiting for promise)', this.promiseTrace);
        if (isPromise(result)) {
            this.resultPromised = true;
            this.promiseTrace = this.trace('setting promise as a result');
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
        this.resultTrace = this.trace('setting result');
        this.maybeFinishResolving();
    }
    setError(error) {
        this.check(!this.resultSet, 'trying to set error on a promise with result already set', this.resultTrace);
        this.check(!this.errorSet, 'error already set', this.errorTrace);
        this.check(!this.resultPromised, 'result already set (waiting for promise)', this.promiseTrace);
        this.check(hasValue(error), 'error must not be undefined nor null');
        this.errorSet = true;
        this.error = error;
        this.errorTrace = this.trace('setting error');
        this.maybeFinishResolving();
    }
    resolveOne(result) {
        this.check(!this.errorSet, 'trying to resolve a promise containing error', this.errorTrace);
        if (result !== undefined) {
            this.setResult(result);
        }
        this.markResolved();
        return this.maybeFinishResolving();
    }
    rejectOne(error) {
        this.check(!this.resultSet, 'trying to reject a promise containing result', this.resultTrace);
        if (error !== undefined) {
            this.setError(error);
        }
        this.check(this.errorSet, 'error must not be undefined nor null');
        this.markRejected();
        return this.maybeFinishResolving();
    }
    toJSON() {
        const { id, resultPromised, resolveChain, resultSet, errorSet, specified, resolved, rejected } = this;
        return { id, resultPromised, resolveChain, resultSet, errorSet, specified, resolved, rejected };
    }
    toString(indent) {
        const flags = this.toJSON();
        const keys = Object.keys(flags)
            .filter(key => key !== 'id')
            .filter(key => flags[key]);
        if (!indent) {
            const stringifiedFlags = keys.map(key => `${key}: ${flags[key]}`);
            return `FakePromise#${this.id}{${stringifiedFlags.join(',')}}`;
        }
        const prefix = SPACES.substring(0, indent);
        const stringifiedFlags = keys.map(key => `${prefix}  ${key}: ${flags[key]},\n`);
        return `${prefix}FakePromise#${this.id} {\n${stringifiedFlags.join('')}${prefix}}`;
    }
    markResolveChain() {
        this.resolveChain = true;
    }
    markResolved() {
        this.check(!this.resolved, 'promise already resolved', this.resolveTrace);
        this.check(!this.rejected, 'promise already rejected', this.rejectTrace);
        this.resolved = true;
        this.resolveTrace = this.trace('resolve');
    }
    markRejected() {
        this.check(!this.resolved, 'promise already resolved', this.resolveTrace);
        this.check(!this.rejected, 'promise already rejected', this.rejectTrace);
        this.rejected = true;
        this.rejectTrace = this.trace('reject');
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
    check(condition, message, stacktrace) {
        if (!condition) {
            const formattedState = `\n    CURRENT STATE:\n${this.toString(6)}`;
            throw new Error(`${message}${formattedState}${stacktrace ? stacktrace : ''}`);
        }
    }
    trace(name) {
        const stateTitle = `state after ${name}`.toUpperCase();
        const formattedState = `    ${stateTitle}:\n${this.toString(6)}`;
        const error = new Error('error');
        const stack = error.stack;
        const traceTitle = `stacktrace of ${name}`.toUpperCase();
        const firstNewline = stack.indexOf('\n');
        const secondNewline = stack.indexOf('\n', firstNewline + 1);
        const formattedStack = `  ${traceTitle}:${stack.substring(secondNewline)}\n  EOS`
            .split('\n')
            .map(line => `  ${line}`)
            .join('\n');
        return `\n${formattedState}\n${formattedStack}`;
    }
}
exports.FakePromise = FakePromise;
exports.default = FakePromise;
function hasValue(arg) {
    return (arg !== null && arg !== undefined);
}
function isPromise(arg) {
    return hasValue(arg) && typeof arg.then === 'function';
}
//# sourceMappingURL=FakePromise.js.map