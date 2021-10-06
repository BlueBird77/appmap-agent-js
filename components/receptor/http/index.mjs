import { createServer as createTCPServer } from "net";
import { createServer as createHTTPServer } from "http";
import { patch } from "net-socket-messaging";

const _Map = Map;
const { parse: parseJSON } = JSON;

export default (dependencies) => {
  const {
    http: { generateRespond },
    service: { openServiceAsync, closeServiceAsync, getServicePort },
    backend: {
      createBackend,
      sendBackend,
      hasBackendTrace,
      hasBackendTrack,
      getBackendTrackIterator,
      takeBackendTrace,
    },
  } = dependencies;
  const disconnection = {
    status: 1,
    errors: [
      {
        name: "AppmapError",
        message: "disconnection",
        stack: "",
      },
    ],
  };
  return {
    openReceptorAsync: async ({
      "track-port": track_port,
      "trace-port": trace_port,
    }) => {
      const trace_server = createTCPServer();
      const track_server = createHTTPServer();
      const backends = new _Map();
      track_server.on(
        "request",
        generateRespond(async (method, path, body) => {
          const parts = path.split("/");
          if (parts.length !== 3 || parts[0] !== "") {
            return {
              code: 400,
              message: "Bad Request",
              body: null,
            };
          }
          let [, session, record] = parts;
          if (session === "_appmap") {
            const iterator = backends.keys();
            const { done, value } = iterator.next();
            if (done) {
              return {
                code: 404,
                message: "No Active Session",
                body: null,
              };
            }
            session = value;
          } else if (!backends.has(session)) {
            return {
              code: 404,
              message: "Missing Session",
              body: null,
            };
          }
          const backend = backends.get(session);
          if (method === "POST") {
            if (
              hasBackendTrack(backend, record) ||
              hasBackendTrace(backend, record)
            ) {
              return {
                code: 409,
                message: "Duplicate Track",
                body: null,
              };
            }
            sendBackend(backend, [
              "start",
              record,
              { path: null, data: {}, ...body },
            ]);
            return {
              code: 200,
              message: "OK",
              body: null,
            };
          }
          if (method === "GET") {
            return {
              code: 200,
              message: "OK",
              body: {
                enabled: hasBackendTrack(backend, record),
              },
            };
          }
          if (method === "DELETE") {
            if (hasBackendTrack(backend, record)) {
              sendBackend(backend, [
                "stop",
                record,
                { status: 0, errors: [], ...body },
              ]);
            } else if (!hasBackendTrace(backend, record)) {
              return {
                code: 404,
                message: "Missing Track",
                body: null,
              };
            }
            const { body: trace } = takeBackendTrace(backend, record);
            return {
              code: 200,
              message: "OK",
              body: trace,
            };
          }
        }),
      );
      trace_server.on("connection", (socket) => {
        patch(socket);
        socket.on("message", (session) => {
          socket.removeAllListeners("message");
          socket.on("message", (content) => {
            socket.removeAllListeners("message");
            const configuration = parseJSON(content);
            const backend = createBackend(configuration);
            backends.set(session, backend);
            socket.on("close", () => {
              for (const key of getBackendTrackIterator(backend)) {
                sendBackend(backend, ["stop", key, disconnection]);
              }
            });
            socket.on("message", (content) => {
              sendBackend(backend, parseJSON(content));
            });
          });
        });
      });
      const trace_service = await openServiceAsync(trace_server, trace_port);
      const track_service = await openServiceAsync(track_server, track_port);
      return { trace_service, track_service };
    },
    getReceptorTracePort: ({ trace_service }) => getServicePort(trace_service),
    getReceptorTrackPort: ({ track_service }) => getServicePort(track_service),
    closeReceptorAsync: async ({ trace_service, track_service }) => {
      await closeServiceAsync(trace_service);
      await closeServiceAsync(track_service);
    },
  };
};
