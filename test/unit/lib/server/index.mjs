import { strict as Assert } from 'assert';
import { Server } from 'net';
import * as FileSystem from 'fs';
import * as Agent from '../../../../lib/server/index.mjs';

Assert.ok(Agent.createServer('messaging', null, {}) instanceof Server);

Assert.ok(
  Agent.createServer('messaging', { name: 'app-name' }, {}) instanceof Server,
);

FileSystem.writeFileSync(
  'tmp/test/appmap.json',
  JSON.stringify({ name: 'app-name' }),
  'utf8',
);
Assert.ok(
  Agent.createServer('messaging', 'tmp/test/appmap.json', {}) instanceof Server,
);

const env = {
  APPMAP_PROTOCOL: 'messaging',
  APPMAP_HOST: 'localhost',
  APPMAP_PORT: '0',
  APPMAP_HOOK_CHILD_PROCESS: 'false',
};

Assert.deepEqual(
  Agent.compileOptions({
    'hook-esm': false,
    'hook-cjs': false,
    port: 'unix-domain-socket',
    'node-version': '14.x',
    'rc-file': 'appmap.yml',
  }),
  {
    env: {
      ...env,
      APPMAP_PORT: 'unix-domain-socket',
      APPMAP_RC_FILE: 'appmap.yml',
    },
    execArgv: [],
  },
);

Assert.deepEqual(
  Agent.compileOptions({
    'hook-esm': false,
    'hook-cjs': true,
  }),
  {
    env,
    execArgv: [
      '--require',
      `${process.cwd()}/lib/client/es2015/node14x/index-cjs.js`,
    ],
  },
);

Assert.deepEqual(
  Agent.compileOptions({
    'hook-esm': true,
    'hook-cjs': false,
  }),
  {
    env,
    execArgv: [
      '--experimental-loader',
      `${process.cwd()}/lib/client/es2015/node14x/index-esm.js`,
    ],
  },
);

Assert.deepEqual(
  Agent.compileOptions({
    'hook-esm': true,
    'hook-cjs': true,
  }),
  {
    env,
    execArgv: [
      '--experimental-loader',
      `${process.cwd()}/lib/client/es2015/node14x/index-esm-cjs.js`,
    ],
  },
);

{
  const path = 'tmp/test/main.js';
  const options = {
    protocol: 'inline',
    'hook-esm': false,
    'hook-cjs': false,
  };
  FileSystem.writeFileSync(path, `123;`, 'utf8');
  Agent.fork(path, [], {}, options);
  Agent.spawn('node', [path], {}, options);
  Agent.spawnSync('node', [path], {}, options);
}
