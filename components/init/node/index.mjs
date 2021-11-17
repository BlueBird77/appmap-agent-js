import fs from "fs";
import glob from "glob";
import klaw from "klaw-sync";
import { basename, join } from "path";
import YAML from "yaml";

// Glob to match/exclude all the directories we should scan for source files:
const GLOB = "!(node_modules)/";

/* c8 ignore start */
export const externals = {
  showResults(str) {
    process.stdout.write(str);
  },
};
/* c8 ignore stop */

export default (dependencies) => {
  const findDirsWithFiles = (root, pattern) => {
    const paths = new Set();
    const hasMatch = (item) => {
      if (!item.stats.isDirectory()) {
        return false;
      }

      if (
        glob.sync(pattern, { cwd: item.path, strict: false, silent: true })
          .length !== 0
      ) {
        paths.add(item.path);
        return true;
      }
      return false;
    };
    // If there are no matches in the directory, continue scanning the tree.
    const scanIf = (item) => !hasMatch(item);

    // Use GLOB to find directory trees to scan. For each tree, return the
    // shallowest path that contains a match for pattern.
    //
    // Set options to keep glob quiet while scanning so we don't distract the
    // user. (Note that, as described in
    // https://github.com/isaacs/node-glob/issues/298, strict is true by
    // default.)
    const gs = glob.GlobSync(GLOB, { cwd: root, strict: false, silent: true });
    const dirs = gs.found.map((d) => d.slice(0, -1));
    dirs.forEach((dir) => {
      const path = join(root, dir);
      const match_present = hasMatch({ path, stats: fs.statSync(path) });
      if (!match_present) {
        // klaw-sync doesn't provide a way to suppress errors in the same way
        // that GlobSync does. So, arrange for klaw-sync to call GlobSync's
        // implementation of readdir.
        const klaw_fs = { ...fs };
        klaw_fs.readdirSync = (path, options) => {
          let ret = glob.GlobSync.prototype._readdir.bind(gs)(path, options);
          if (!ret) {
            ret = [];
          }
          return ret;
        };

        // Also, klaw-sync calls the filter function before checking if the item is a
        // directory, so there's no point in using its nofile option.
        klaw(path, { fs: klaw_fs, filter: scanIf });
      }
    });

    return Array.from(paths);
  };

  const run = (root) => {
    const dirs = findDirsWithFiles(root, "*.map").concat(
      findDirsWithFiles(root, "+(*.[tj]s|*.[cm]js)"),
    );

    const root_len = root.length;
    const config = {
      name: basename(root),
      packages: dirs.map((d) => ({ path: d.substr(root_len + 1) })),
    };
    const result = {
      filename: "appmap.yml",
      configuration: {
        contents: YAML.stringify(config),
      },
    };
    return JSON.stringify(result, null, 2);
  };

  return {
    run,

    main: (root) => {
      const json = run(root);
      externals.showResults(json);
      return true;
    },
  };
};
