const _eval = eval;
const _Promise = Promise;

export default (dependencies) => {
  const {
    interpretation: { runScript },
    client: { sendClient, asyncClientTermination },
    state: {
      getSerializationEmptyValue,
      getInstrumentationIdentifier,
      incrementEventCounter,
      recordBeforeApply,
      recordAfterApply,
    },
    util: { noop },
  } = dependencies;
  return {
    hookApplyAsync: async (client, state, { hooks: { apply } }) => {
      if (!apply) {
        return _Promise.resolve(null);
      }
      const identifier = getInstrumentationIdentifier(state);
      runScript(
        `const ${identifier} = {beforeApply:null, afterApply:null, empty:null};`,
      );
      const runtime = _eval(identifier);
      runtime.empty = getSerializationEmptyValue(state);
      runtime.beforeApply = (_function, _this, _arguments) => {
        const index = incrementEventCounter(state);
        sendClient(
          client,
          recordBeforeApply(state, index, {
            function: _function,
            this: _this,
            arguments: _arguments,
          }),
        );
        return index;
      };
      runtime.afterApply = (index, error, result) => {
        sendClient(client, recordAfterApply(state, index, { error, result }));
      };
      try {
        return await asyncClientTermination(client);
      } finally {
        runtime.empy = null;
        runtime.beforeApply = noop;
        runtime.afterApply = noop;
      }
    },
  };
};