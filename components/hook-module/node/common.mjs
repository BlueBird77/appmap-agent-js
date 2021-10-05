import Module from "module";
const { apply } = Reflect;

const { prototype } = Module;

export default (dependencies) => {
  const {
    util: { assignProperty },
    frontend: { instrument },
    emitter: { sendEmitter },
  } = dependencies;
  return {
    unhookCommonModule: (backup) => {
      backup.forEach(assignProperty);
    },
    hookCommonModule: (
      emitter,
      frontend,
      { hooks: { cjs }, repository: { directory } },
    ) => {
      if (!cjs) {
        return [];
      }
      const { _compile: original } = prototype;
      prototype._compile = function _compile(code1, path) {
        const { code: code2, message } = instrument(
          frontend,
          "script",
          path,
          code1,
        );
        if (message !== null) {
          sendEmitter(emitter, message);
        }
        return apply(original, this, [code2, path]);
      };
      return [{ object: prototype, key: "_compile", value: original }];
    },
  };
};
