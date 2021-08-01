import * as FileSystem from 'fs';
import * as Path from 'path';
import YAML from 'yaml';
import { home } from '../../home.js';
import { validateConfiguration } from '../validate.mjs';
import { Left, Right } from '../either.mjs';
import { resolvePath, changeWorkingDirectory } from './cwd.mjs';
import { lookupNormalizedSpecifierArray } from './specifier.mjs';
import { spawnNormalizedChild } from './child.mjs';
import { extendField, makeInitialFieldObject } from './field.mjs';
import { getRegExp } from "../regexp-cache.mjs";

const {parse:parseJSON} = JSON;
const {parse:parseYAML} = YAML;

export default (dependencies) => {

  const npm = JSON.parse(
    FileSystem.readFileSync(Path.join(home, 'package.json'), 'utf8'),
  );

  const isEnabledDefault = { enabled: false };

  const getInstrumentationDefault = {
    enabled: false,
    shallow: false,
    exclude: [],
  };

  const parsers = {
    __proto__: null,
    '.json': parseJSON,
    '.yml': parseYAML,
    '.yaml': parseYAML,
  };

  const extendWithData = (basedir, data, done = []) =>
    return validateConfiguration(data2).bind((data2) =>
      changeWorkingDirectory(data2.cwd, () => {
        data2 = { ...data2 };
        delete data2.cwd;
        data2 = { __proto__: null, ...data2 };
        let either;
        if ('extends' in data2) {
          if (typeof data2.extends === 'string') {
            either = this.extendWithFile(resolvePath(data2.extends), done);
          } else {
            either = this.extendWithData(data2.extends, done);
          }
          delete data2.extends;
        } else {
          either = new Right(this);
        }
        return either.mapRight(({ data: data1 }) => {
          data1 = { __proto__: null, ...data1 };
          for (const key in data2) {
            extendField(data1, key, data2[key]);
          }
          return new Configuration(data1);
        });
      }),
    );
  };

  const extendWithFile = (path, done = []) => {
    path = Path.resolve(path);
    const parse = parsers[Path.extname(path)];
    if (parse === undefined) {
      return new Left(
        `invalid extension for configuration file ${JSON.stringify(
          path,
        )}, expected one of: ${Reflect.ownKeys(parsers).join(', ')}`,
      );
    }
    if (done.includes(path)) {
      return new Left(
        `detected loop in configuration file hierarchy ${[...done, path]
          .map(JSON.stringify)
          .join(' -> ')}`,
      );
    }
    let content;
    try {
      content = FileSystem.readFileSync(path, 'utf8');
    } catch (error) {
      return new Left(
        `failed to read configuration file ${path} >> ${error.message}`,
      );
    }
    let data;
    try {
      data = parse(content);
    } catch (error) {
      return new Left(
        `failed to parse configuration file ${path} >> ${error.message}`,
      );
    }
    data = {
      cwd: Path.dirname(path),
      ...data,
    };
    return this.extendWithData(data, [...done, path]);
  }


  class Configuration {
    constructor(data) {
      this.data = data;
    }


    isEnabled() {
      if (this.data.main.path === null) {
        return new Left('missing main path for availability query');
      }
      return new Right(
        lookupNormalizedSpecifierArray(
          this.data.enabled,
          this.data.main.path,
          isEnabledDefault,
        ).enabled,
      );
    }
    isClassMapPruned() {
      return this.data['class-map-pruning'];
    }
    isEventPruned() {
      return this.data['event-pruning'];
    }
    getEscapePrefix() {
      return this.data['escape-prefix'];
    }
    getLanguageVersion() {
      return this.data.language.version;
    }
    getInstrumentation(path) {
      const { enabled, shallow, exclude } = lookupNormalizedSpecifierArray(
        this.data.packages,
        path,
        getInstrumentationDefault,
      );
      return {
        source: this.data.source,
        enabled,
        shallow,
        exclude: (name) => {
          const match = (exclusion) => getRegExp(exclusion).test(name);
          return this.data.exclude.some(match) || exclude.some(match);
        }
      };
    }
    getBaseDirectory() {
      return this.data.base.directory;
    }
    getOutputPath() {
      let filename = 'anonymous';
      if (this.data.output['file-name'] !== null) {
        filename = this.data.output['file-name'];
      } else if (this.data['map-name'] !== null) {
        filename = this.data['map-name'];
      } else if (this.data.main.path !== null) {
        filename = this.data.main.path;
      }
      return Path.join(
        this.data.output.directory,
        filename.replace(/[/\t\n ]/g, '-'),
      );
    }
    getMetaData() {
      return {
        name: this.data['map-name'],
        labels: this.data.labels,
        app: this.data['app-name'],
        feature: this.data.feature,
        feature_group: this.data['feature-group'],
        language: {
          name: this.data.language.name,
          version: this.data.language.version,
          engine:
            this.data.engine.name === null
              ? null
              : `${this.data.engine.name}@${this.data.engine.version}`,
        },
        frameworks: this.data.frameworks,
        client: {
          name: npm.name,
          url: npm.repository.url,
          version: npm.version,
        },
        recorder: {
          name: this.data.recorder,
        },
        recording: this.data.recording,
        git: this.data.base.git,
      };
    }
    getHooks() {
      return this.data.hooks;
    }
    getConcurrency() {
      return this.data.concurrency;
    }
    getProtocol() {
      return this.data.protocol;
    }
    getHost() {
      return this.data.host;
    }
    getPort() {
      return this.data.port;
    }
    getChildren() {
      return this.data.children;
    }
    spawnChild(child) {
      return spawnNormalizedChild(child, this);
    }
    serialize() {
      return JSON.stringify({
        cwd: '/',
        ...this.data,
      });
    }
  }

  const configuration = new Configuration(makeInitialFieldObject());

  export const getInitialConfiguration = () => configuration;

};