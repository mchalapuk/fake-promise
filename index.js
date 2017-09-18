const FakePromise = require('./lib/FakePromise').default;

module.exports = Object.assign(
  FakePromise,
  { default: FakePromise, Promise: FakePromise, FakePromise }
);

