import * as Path from 'path';
import * as ChildProcess from 'child_process';
import { strict as Assert } from 'assert';
import { fileURLToPath } from 'url';
import makeRequestSync from '../../../../../../../../lib/client/es2015/node14x/channel/request-sync/messaging.js';

const child = ChildProcess.fork(
  Path.join(
    Path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '__fixture_net_server__.mjs',
  ),
  ['0'],
  {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  },
);
child.on('exit', (code, signal) => {
  Assert.equal(code, null);
  Assert.equal(signal, 'SIGINT');
});

child.on('message', (port) => {
  const requestSync = makeRequestSync('localhost', port);
  Assert.equal(
    requestSync({
      success: 123,
      failure: null,
    }),
    123,
  );
  Assert.throws(
    () =>
      requestSync({
        success: null,
        failure: 'BOUM',
      }),
    /^Error: BOUM/,
  );
  child.kill('SIGINT');
});

Assert.throws(() => makeRequestSync('invalid-address', 0));

Assert.throws(() => makeRequestSync('foobar', '/missing-ipc-socket.sock'));