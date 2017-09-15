"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FakePromise {
    then(onResolved, onRejected) {
        throw new Error('not implemented');
    }
}
exports.FakePromise = FakePromise;
exports.default = FakePromise;
//# sourceMappingURL=FakePromise.js.map