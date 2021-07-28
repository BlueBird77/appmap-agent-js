import Box from "./box.mjs";
import Counter from "./counter.mjs";
import Function from "./function.mjs";
import Object from "./object.mjs";
import Path from "./path.mjs";

export default (dependencies) => {
  return {
    ...Box(dependencies),
    ...Counter(dependencies),
    ...Function(dependencies),
    ...Object(dependencies),
    ...Path(dependencies),
  };
};