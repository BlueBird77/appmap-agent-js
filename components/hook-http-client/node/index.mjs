import Http from "http";
import Https from "https";

const { apply, construct } = Reflect;
const { nextTick } = process;
const _Proxy = Proxy;

export default (dependencies) => {
  const {
    util: { assignProperty, getOwnProperty },
    "hook-http": { parseContentType, decodeSafe, parseJSONSafe, spyReadable },
    agent: {
      getSerializationEmptyValue,
      recordBeginBundle,
      recordEndBundle,
      recordBeforeClient,
      recordAfterClient,
    },
  } = dependencies;
  return {
    unhook: (backup) => backup.forEach(assignProperty),
    hook: (agent, { hooks: { http } }) => {
      if (!http) {
        return [];
      }
      const backup = [
        ...["ClientRequest", "request", "get"].map((key) => ({
          object: Http,
          key,
        })),
        ...["request", "get"].map((key) => ({ object: Https, key })),
      ].map(({ object, key }) => ({ object, key, value: object[key] }));
      const spyRequest = (request) => {
        let index1;
        let index2;
        request.on("finish", () => {
          const { method, path: url } = request;
          const headers = request.getHeaders();
          index1 = recordBeginBundle(agent, null);
          index2 = recordBeforeClient(agent, {
            protocol: "HTTP/1.1",
            method,
            url,
            route: null,
            headers,
            body: getSerializationEmptyValue(agent),
          });
        });
        request.on("response", (response) => {
          const {
            headers,
            statusCode: status,
            statusMessage: message,
          } = response;
          let body = getSerializationEmptyValue(agent);
          const { type, subtype, parameters } = parseContentType(
            getOwnProperty(headers, "content-type", "text/plain"),
          );
          if (type === "application" && subtype === "json") {
            spyReadable(response, (buffer) => {
              const maybe = decodeSafe(
                buffer,
                getOwnProperty(parameters, "charset", "utf-8"),
                null,
              );
              if (maybe !== null) {
                body = parseJSONSafe(maybe, getSerializationEmptyValue(agent));
              }
            });
          }
          // Hopefully, this is triggered before user 'end' handlers.
          // Use of removeAllListeners or prependListener will break this assumption.
          response.on("end", () => {
            recordAfterClient(agent, index2, {
              status,
              message,
              headers,
              body,
            });
          });
          nextTick(() => {
            // Hoopfully, this is triggered after user 'end' handlers.
            // Since emit is synchronous the groups will still match!
            response.on("end", () => {
              recordEndBundle(agent, index1, null);
            });
          });
        });
      };
      const traps = {
        __proto__: null,
        apply: (target, context, values) => {
          const request = apply(target, context, values);
          spyRequest(request);
          return request;
        },
        construct: (target, values, newtarget) => {
          const request = construct(target, values, newtarget);
          spyRequest(request);
          return request;
        },
      };
      for (const { object, key, value } of backup) {
        object[key] = new _Proxy(value, traps);
      }
      return backup;
    },
  };
};