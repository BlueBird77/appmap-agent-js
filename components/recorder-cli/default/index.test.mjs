import { version } from "node:process";
import "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { record } from "./index.mjs";

for (const enabled of [false, true]) {
  record(
    {
      cwd: () => convertFileUrlToPath("file:///w:/cwd"),
      argv: ["node", "main.mjs"],
      version,
    },
    extendConfiguration(
      createConfiguration("file:///w:/home/"),
      {
        processes: [{ regexp: "", enabled }],
        recorder: "process",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "file:///w:/base/",
    ),
  );
}
