import util$default from "./../components/util/default/index.mjs";
import violation$exit from "./../components/violation/exit/index.mjs";
import expect_inner$default from "./../components/expect-inner/default/index.mjs";
import expect$default from "./../components/expect/default/index.mjs";
import validate$ajv from "./../components/validate/ajv/index.mjs";
import specifier$default from "./../components/specifier/default/index.mjs";
import spawn$node from "./../components/spawn/node/index.mjs";
import log_inner$write_sync from "./../components/log-inner/write-sync/index.mjs";
import log$debug from "./../components/log/debug/index.mjs";
import log$error from "./../components/log/error/index.mjs";
import log$info from "./../components/log/info/index.mjs";
import log$off from "./../components/log/off/index.mjs";
import log$warning from "./../components/log/warning/index.mjs";
import repository$node from "./../components/repository/node/index.mjs";
import child$default from "./../components/child/default/index.mjs";
import configuration$default from "./../components/configuration/default/index.mjs";
import configuration_boot$default from "./../components/configuration-boot/default/index.mjs";

export default (blueprint) => {
  const dependencies = { __proto__: null };
  dependencies["util"] = util$default(dependencies);
  dependencies["violation"] = violation$exit(dependencies);
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["validate"] = validate$ajv(dependencies);
  dependencies["specifier"] = specifier$default(dependencies);
  dependencies["spawn"] = spawn$node(dependencies);
  dependencies["log-inner"] = log_inner$write_sync(dependencies);
  dependencies["log"] =
    blueprint["log"] === "warning"
      ? log$warning(dependencies)
      : blueprint["log"] === "off"
      ? log$off(dependencies)
      : blueprint["log"] === "info"
      ? log$info(dependencies)
      : blueprint["log"] === "error"
      ? log$error(dependencies)
      : blueprint["log"] === "debug"
      ? log$debug(dependencies)
      : (() => {
          throw new Error("invalid instance for component log");
        })();
  dependencies["repository"] = repository$node(dependencies);
  dependencies["child"] = child$default(dependencies);
  dependencies["configuration"] = configuration$default(dependencies);
  dependencies["configuration-boot"] = configuration_boot$default(dependencies);
  return dependencies["configuration-boot"];
};