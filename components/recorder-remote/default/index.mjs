import { createServer } from "http";

export default (dependencies) => {
  const {
    util: { assert },
    configuration: { isConfigurationEnabled },
    agent: { openAgent, closeAgent, requestRemoteAgentAsync },
    http: { generateRespond },
  } = dependencies;
  return {
    main: (process, configuration) => {
      const { recorder, "frontend-track-port": port } = configuration;
      assert(recorder === "remote", "expected remote recorder");
      if (isConfigurationEnabled(configuration)) {
        if (port !== null) {
          const server = createServer();
          server.unref();
          server.on(
            "request",
            generateRespond((method, path, body) =>
              requestRemoteAgentAsync(agent, method, path, body),
            ),
          );
          server.listen(port);
        }
        const agent = openAgent(configuration);
        process.on("exit", (status, signal) => {
          closeAgent(agent);
        });
      }
    },
  };
};
