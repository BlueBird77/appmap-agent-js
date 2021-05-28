const PosixSocket = require("posix-socket");
const PosixSocketMessaging = require("posix-socket-messaging");
const { assert, expect } = require("../../check.js");

const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;

exports.makeRequest = (host, port) => {
  let sockfd;
  let options;
  if (typeof port === "number") {
    sockfd = PosixSocket.socket(
      PosixSocket.AF_INET,
      PosixSocket.SOCK_STREAM,
      0
    );
    PosixSocket.setsockopt(
      sockfd,
      PosixSocket.IPPROTO_TCP,
      PosixSocket.TCP_NODELAY,
      1
    );
    options = {
      sin_family: 2,
      sin_addr: host === "localhost" ? "127.0.0.1" : host,
      sin_port: port,
    };
  } else {
    sockfd = PosixSocket.socket(
      PosixSocket.AF_UNIX,
      PosixSocket.SOCK_STREAM,
      0
    );
    options = {
      sun_family: 1,
      sun_path: port,
    };
  }
  try {
    PosixSocket.connect(sockfd, options);
  } catch (error) {
    expect(
      false,
      "failed to connect socket: %o to: %j >> %s",
      sockfd,
      options,
      error.message
    );
  }
  return (json) => {
    let message = global_JSON_stringify({ head: 0, body: json });
    try {
      PosixSocketMessaging.send(sockfd, message);
      message = PosixSocketMessaging.receive(sockfd);
    } /* c8 ignore start */ catch (error) {
      expect(
        false,
        "failed to send/receive message to socket: %o >>",
        sockfd,
        error.message
      );
    } /* c8 ignore stop */
    json = global_JSON_parse(message);
    expect(json.type !== "left", json.body);
    assert(json.type === "right", "invalid type field: %o", json.type);
    return json.body;
  };
};