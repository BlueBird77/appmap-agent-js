
import { strict as Assert } from 'assert';
import {getRuntime} from '../../../../../lib/client/es2015/runtime.js';

const runtime = getRuntime();

Assert.equal(typeof runtime.empty, 'symbol');

Assert.equal(runtime.undefined, undefined);

Assert.equal(typeof runtime.getNow(), 'number');

Assert.equal(runtime.record, null);

Assert.equal(typeof runtime.event, 'number');

Assert.equal(runtime.getClassName(null), 'null');
Assert.equal(runtime.getClassName(123), 'number');
Assert.equal(runtime.getClassName(new Date()), 'Date');
Assert.equal(
  runtime.getClassName({
    get constructor() {
      return 'foo';
    },
  }),
  'Unknown',
);
Assert.equal(
  runtime.getClassName({
    "constructor": {
      name: 123
    }
  }),
  'Unknown',
);
Assert.equal(
  runtime.getClassName({
    "constructor": {},
  }),
  'Unknown',
);
Assert.equal(
  runtime.getClassName({
    "constructor": {
      get name() {
        return 'foo';
      },
    },
  }),
  'Unknown',
);

{
  const object1 = {};
  const object2 = function f() {};
  const symbol1 = Symbol('foo');
  const symbol2 = Symbol('bar');
  Assert.equal(runtime.getIdentity(123), null);
  Assert.equal(runtime.getIdentity(object1), 1);
  Assert.equal(runtime.getIdentity(symbol1), 2);
  Assert.equal(runtime.getIdentity(object2), 3);
  Assert.equal(runtime.getIdentity(symbol2), 4);
  Assert.equal(runtime.getIdentity(object1), 1);
  Assert.equal(runtime.getIdentity(symbol1), 2);
  Assert.equal(runtime.getIdentity(object2), 3);
  Assert.equal(runtime.getIdentity(symbol2), 4);
}

Assert.equal(runtime.serialize(runtime.empty), 'empty');
Assert.equal(runtime.serialize(null), 'null');
Assert.equal(runtime.serialize(undefined), 'undefined');
Assert.equal(runtime.serialize(true), 'true');
Assert.equal(runtime.serialize(false), 'false');
Assert.equal(runtime.serialize(123), '123');
Assert.equal(runtime.serialize(123n), '123n');
Assert.equal(runtime.serialize([]), '[object Array]');
Assert.equal(runtime.serialize(`"'foo'"`), JSON.stringify(`"'foo'"`));

Assert.deepEqual(runtime.serializeParameter(Symbol('foo'), 'pattern'), {
  class: 'symbol',
  name: 'pattern',
  object_id: 5,
  value: '[object Symbol]',
});

{
  const error = new Error('foo');
  Assert.deepEqual(
    runtime.serializeException(runtime.empty),
    [],
  );
  Assert.deepEqual(runtime.serializeException(null), [
    {
      class: 'null',
      message: null,
      object_id: null,
      path: null,
      lineno: null,
    },
  ]);
  Assert.deepEqual(runtime.serializeException(error), [
    {
      class: 'Error',
      message: error.message,
      object_id: 6,
      path: error.stack,
      lineno: null,
    },
  ]);
}