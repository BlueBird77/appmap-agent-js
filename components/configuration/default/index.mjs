const { from: toArray, isArray } = Array;
const { fromEntries, entries: toEntries } = Object;
const { ownKeys } = Reflect;

export default (dependencies) => {
  const {
    util: { assert, identity, toAbsolutePath, hasOwnProperty },
    log: { logInfo },
    validate: { validateConfig },
    specifier: { matchSpecifier },
    engine: { getEngine },
    repository: {
      extractRepositoryHistory,
      extractRepositoryPackage,
      extractRepositoryDependency,
    },
    specifier: { createSpecifier },
    child: { createChildren },
  } = dependencies;

  ////////////
  // Extend //
  ////////////

  const assign = (value1, value2) => ({ ...value1, ...value2 });

  const overwrite = (value1, value2) => value2;

  // const append = (value1, value2) => [...value1, ...value2];

  const prepend = (value1, value2) => [...value2, ...value1];

  const isString = (any) => typeof any === "string";

  const toAbsolutePathFlip = (relative, absolute) =>
    toAbsolutePath(absolute, relative);

  ///////////////
  // Normalize //
  ///////////////

  const normalizePort = (port, nullable_directory) => {
    if (typeof port === "string") {
      port = toAbsolutePath(nullable_directory, port);
    }
    return port;
  };

  const generateNormalizeSplit = (separator, key1, key2) => (value) => {
    if (typeof value === "string") {
      const [value1, value2] = value.split(separator);
      return {
        [key1]: value1,
        [key2]: value2,
      };
    }
    return value;
  };

  const normalizeRecording = generateNormalizeSplit(
    ".",
    "defined-class",
    "method-id",
  );

  const normalizeLanguage = generateNormalizeSplit("@", "name", "version");

  const normalizeEngine = generateNormalizeSplit("@", "name", "version");

  const normalizeFramework = generateNormalizeSplit("@", "name", "version");

  const normalizeFrameworkArray = (frameworks) =>
    frameworks.map(normalizeFramework);

  const normalizeSerialization = (serialization) => {
    if (typeof serialization === "string") {
      serialization = { method: serialization };
    }
    return serialization;
  };

  const normalizeOutput = (output, nullable_directory) => {
    if (output === null) {
      return { target: "http" };
    }
    if (typeof output === "string") {
      output = { directory: output };
    }
    if (hasOwnProperty(output, "directory")) {
      const { directory } = output;
      output = {
        ...output,
        directory: toAbsolutePath(nullable_directory, directory),
      };
    }
    return output;
  };

  const normalizePackageSpecifier = (specifier, nullable_directory) => {
    assert(
      nullable_directory !== null,
      "extending packages configuration requires directory",
    );
    if (typeof specifier === "string") {
      specifier = { glob: specifier };
    }
    const { enabled, shallow, source, exclude, ...rest } = {
      enabled: true,
      source: null,
      shallow: hasOwnProperty(specifier, "dist"),
      exclude: [],
      ...specifier,
    };
    return [
      createSpecifier(nullable_directory, rest),
      { enabled, source, shallow, exclude },
    ];
  };

  const normalizePackages = (specifiers, nullable_directory) => {
    if (!isArray(specifiers)) {
      specifiers = [specifiers];
    }
    return specifiers.map((specifier) =>
      normalizePackageSpecifier(specifier, nullable_directory),
    );
  };

  const normalizeScenarios = (scenarios, nullable_directory) =>
    fromEntries(
      toArray(toEntries(scenarios)).map(([name, children]) => {
        assert(
          nullable_directory !== null,
          "normalizing scenarios elements requires a directory",
        );
        if (!isArray(children) || children.every(isString)) {
          children = [children];
        }
        return [
          name,
          children.flatMap((child) =>
            createChildren(child, nullable_directory),
          ),
        ];
      }),
    );

  const normalizeProcessSpecifier = (specifier, nullable_directory) => {
    assert(
      nullable_directory !== null,
      "normalizing process elements requires a directory",
    );
    if (typeof specifier === "string") {
      specifier = { glob: specifier };
    }
    const { enabled, ...rest } = {
      enabled: true,
      ...specifier,
    };
    return [createSpecifier(nullable_directory, rest), enabled];
  };

  const normalizeProcesses = (specifiers, nullable_directory) => {
    if (!isArray(specifiers)) {
      specifiers = [specifiers];
    }
    return specifiers.map((specifier) =>
      normalizeProcessSpecifier(specifier, nullable_directory),
    );
  };

  ////////////
  // fields //
  ////////////

  const fields = {
    validate: {
      extend: assign,
      normalize: identity,
    },
    mode: {
      extend: overwrite,
      normalize: identity,
    },
    scenario: {
      extend: overwrite,
      normalize: identity,
    },
    scenarios: {
      extend: assign,
      normalize: normalizeScenarios,
    },
    log: {
      extend: overwrite,
      normalize: identity,
    },
    host: {
      extend: overwrite,
      normalize: identity,
    },
    session: {
      extend: overwrite,
      normalize: identity,
    },
    "trace-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "trace-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    "track-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "track-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    "secondary-track-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "secondary-track-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    "intercept-track-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "intercept-track-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    enabled: {
      extend: overwrite,
      normalize: identity,
    },
    processes: {
      extend: prepend,
      normalize: normalizeProcesses,
    },
    recorder: {
      extend: overwrite,
      normalize: identity,
    },
    source: {
      extend: overwrite,
      normalize: identity,
    },
    hooks: {
      extend: assign,
      normalize: identity,
    },
    ordering: {
      extend: overwrite,
      normalize: identity,
    },
    "function-name-placeholder": {
      extend: overwrite,
      normalize: identity,
    },
    serialization: {
      extend: assign,
      normalize: normalizeSerialization,
    },
    "hidden-identifier": {
      extend: overwrite,
      normalize: identity,
    },
    main: {
      extend: overwrite,
      normalize: toAbsolutePathFlip,
    },
    language: {
      extend: assign,
      normalize: normalizeLanguage,
    },
    engine: {
      extend: overwrite,
      normalize: normalizeEngine,
    },
    packages: {
      extend: prepend,
      normalize: normalizePackages,
    },
    exclude: {
      extend: prepend,
      normalize: identity,
    },
    recording: {
      extend: overwrite,
      normalize: normalizeRecording,
    },
    output: {
      extend: assign,
      normalize: normalizeOutput,
    },
    app: {
      extend: overwrite,
      normalize: identity,
    },
    name: {
      extend: overwrite,
      normalize: identity,
    },
    pruning: {
      extend: overwrite,
      normalize: identity,
    },
    labels: {
      extend: prepend,
      normalize: identity,
    },
    feature: {
      extend: overwrite,
      normalize: identity,
      initial: null,
    },
    "feature-group": {
      extend: overwrite,
      normalize: identity,
    },
    frameworks: {
      extend: prepend,
      normalize: normalizeFrameworkArray,
    },
  };

  // const filterEnvironmentPair = ([key, value]) =>
  //   key.toLowerCase().startsWith("appmap_");
  //
  // const mapEnvironmentPair = ([key, value]) => [
  //   key.toLowerCase().substring(7).replace(/_/g, "-"),
  //   value,
  // ];

  const makeBlacklistSpecifier = (basedir) => ({
    basedir,
    source: "(^\\.\\.)|((^|/)node_modules/)",
    flags: "u",
  });

  const makeWhitelistSpecifier = (basedir) => ({
    basedir,
    source: "^",
    flags: "u",
  });

  const getSpecifierValue = (pairs, key) => {
    for (const [specifier, value] of pairs) {
      if (matchSpecifier(specifier, key)) {
        return value;
      }
    }
    /* c8 ignore start */
    assert(false, "missing matching specifier");
    /* c8 ignore stop */
  };

  ////////////
  // export //
  ////////////

  return {
    createConfiguration: (directory) => ({
      // defined at initialization (cannot be overwritten)
      agent: extractRepositoryDependency(directory, "@appland/appmap-agent-js"),
      repository: {
        directory,
        history: extractRepositoryHistory(directory),
        package: extractRepositoryPackage(directory),
      },
      engine: getEngine(),
      // overwritten by the agent
      labels: [],
      feature: null,
      "feature-group": null,
      frameworks: [],
      main: null,
      recording: null,
      // provided by the user
      mode: "remote",
      host: "localhost",
      session: null,
      "trace-port": 0, // possibly overwritten by the agent
      "trace-protocol": "TCP",
      "track-port": 0, // possibly overwritten by the agent
      "track-protocol": "HTTP/1.1",
      "secondary-track-port": null,
      "secondary-track-protocol": "HTTP/1.1",
      "intercept-track-port": null,
      "intercept-track-protocol": "HTTP/1.1",
      validate: {
        appmap: false,
        message: false,
      },
      scenario: "anonymous",
      scenarios: {},
      log: "info",
      output: {
        target: "file",
        directory: `${directory}/tmp/appmap`,
        basename: null,
        extension: ".appmap.json",
      },
      enabled: "process",
      processes: [
        [makeBlacklistSpecifier(directory), false],
        [makeWhitelistSpecifier(directory), true],
      ],
      recorder: "process",
      source: false,
      hooks: {
        apply: true,
        esm: true,
        cjs: true,
        http: true,
        mysql: false,
        sqlite3: false,
        pg: false,
      },
      ordering: "chronological",
      "function-name-placeholder": "()",
      serialization: {
        "maximum-length": 96,
        "include-constructor-name": true,
        method: "toString",
      },
      "hidden-identifier": "APPMAP",
      language: {
        name: "ecmascript",
        version: "2020",
      },
      packages: [
        [
          makeBlacklistSpecifier(directory),
          {
            enabled: false,
            shallow: true,
            exclude: [],
            source: null,
          },
        ],
        [
          makeWhitelistSpecifier(directory),
          {
            enabled: true,
            shallow: false,
            exclude: [],
            source: null,
          },
        ],
      ],
      exclude: [],
      pruning: false,
      app: null,
      name: null,
    }),
    // extractEnvironmentConfiguration: (env) =>
    //   fromEntries(
    //     toArray(toEntries(env))
    //       .filter(filterEnvironmentPair)
    //       .map(mapEnvironmentPair),
    //   ),
    extendConfiguration: (configuration, data, nullable_directory) => {
      configuration = { ...configuration };
      validateConfig(data);
      for (let key of ownKeys(data)) {
        const { normalize, extend } = fields[key];
        configuration[key] = extend(
          configuration[key],
          normalize(data[key], nullable_directory),
        );
      }
      return configuration;
    },
    getConfigurationPackage: getSpecifierValue,
    isConfigurationEnabled: ({ enabled, processes, main }) => {
      if (typeof enabled !== "boolean") {
        assert(enabled === "process", "unexpeced enabled value");
        if (main !== null) {
          enabled = getSpecifierValue(processes, main);
        }
      }
      logInfo(`%s %s`, enabled ? "recording" : "bypassing", main);
      return enabled;
    },
  };
};
