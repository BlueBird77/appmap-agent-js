import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import Git from '../../../lib/git.mjs';
import AppMap from '../../../lib/appmap.mjs';

const outdir = 'tmp/appmap';

const settings = {
  __proto__: null,
  getAppName(...args) {
    Assert.equal(this, settings);
    Assert.deepEqual(args, []);
    return 'myapp';
  },
  getOutputDir(...args) {
    Assert.equal(this, settings);
    Assert.deepEqual(args, []);
    return outdir;
  },
};

const name = 'foobar';

const file = {
  getPath(...args) {
    Assert.equal(this, file);
    Assert.deepEqual(args, []);
    return `/${name}.js`;
  },
};

{
  const git = {
    __proto__: null,
    isRepository(...args) {
      Assert.equal(this, git);
      Assert.deepEqual(args, []);
      return false;
    },
  };
  const appmap = new AppMap(git, settings, file);
  appmap.addEntity('entity1');
  appmap.setEngine('engine-name-1', 'engine-version-1');
  appmap.setEngine('engine-name-2', 'engine-version-2');
  appmap.addEvent('event1');
  appmap.addEvent('event2');
  appmap.archive('termination1');
  appmap.addEntity('entity2');
  appmap.setEngine('engine-name-3', 'engine-version-1');
  appmap.addEvent('event3');
  appmap.archive('termination2');
  const json = JSON.parse(
    FileSystem.readFileSync(`${outdir}/${name}.appmap.json`, 'utf8'),
  );
  Assert.deepEqual(json.classMap, ['entity1']);
  Assert.equal(json.metadata.language.engine, 'engine-name-2@engine-version-2');
  Assert.deepEqual(json.events, ['event1', 'event2']);
}

{
  const url = 'https://github.com/lachrist/sample.git';
  const path = 'tmp/test/sample-git/';
  if (!FileSystem.existsSync(path)) {
    ChildProcess.execSync(`git clone ${url} ${path}`);
  }
  const git = new Git(path);
  const appmap = new AppMap(git, settings, file);
  appmap.archive('termination1');
  const json = JSON.parse(
    FileSystem.readFileSync(`${outdir}/${name}.appmap.json`, 'utf8'),
  );
  Assert.equal(json.metadata.git.repository, url);
}
