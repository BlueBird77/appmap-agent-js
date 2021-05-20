import { strict as Assert } from 'assert';
import { expectVersion } from '../../../../../../lib/client/es2015/node14x/version.js';

Assert.equal(expectVersion('foo', '1.2.3', '1.2.3'), null);

Assert.equal(expectVersion('foo', '2.0', '1.9'), null);

Assert.equal(expectVersion('foo', '1.2.3', '1.2'), null);
