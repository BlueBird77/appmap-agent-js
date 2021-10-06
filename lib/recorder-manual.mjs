
import Boot from "../dist/node-boot.mjs";
import ManualRecorder from "../dist/node-recorder-manual.mjs";

const { cwd } = process;
const { bootManualRecorder, bootManualRecorderAsync } = Boot({log:"info"});

export const createAppmap = (home = cwd(), conf = "appmap.yml", base = cwd()) => {
  if (typeof conf === "string" && conf[0] !== "/") {
    conf = `${cwd()}/${conf}`;
  }
  const configuration = bootManualRecorder(home, conf, base);
  const {log, validate:{message:validate_message, appmap:validate_appmap}} = configuration;
  const { Appmap } = ManualRecorder({
    emitter: "local",
    log,
    violation: "error",
    "validate-message": validate_message ? "on" : "off",
    "validate-appmap": validate_appmap ? "on" : "off",
  });
  return new Appmap(configuration);
};
