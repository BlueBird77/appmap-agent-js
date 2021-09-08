import Frame from "./frame.mjs";
import Classmap from "./classmap.mjs";
import Event from "./event.mjs";

const _Map = Map;

export default (dependencies) => {
  const { getClassmapClosure } = Classmap(dependencies);
  const {
    compileBeginEventData,
    compileEndEventData,
    compileBeforeEventData,
    compileAfterEventData,
  } = Event(dependencies);
  const completions = new _Map([
    [
      "apply",
      {
        type: "apply",
        error: null,
        result: {
          type: "string",
          print: "MANUFACTURED APPMAP RETURN VALUE",
        },
      },
    ],
    [
      "response",
      {
        type: "response",
        status: 200,
        message: "MANUFACTURED-APPMAP-RESPONSE",
        headers: {},
      },
    ],
    [
      "query",
      {
        type: "query",
        error: { type: "null", print: "null" },
      },
    ],
    [
      "request",
      {
        type: "request",
        status: 200,
        message: "MANUFACTURED-APPMAP-RESPONSE",
        headers: {},
      },
    ],
  ]);
  const { isJumpFrame, isBundleFrame } = Frame(dependencies);
  const digestTrace = (frame, slice, classmap) => {
    let counter = 0;
    const generateLoop = (shallow) => (frame) => {
      if (isJumpFrame(frame)) {
        if (frame.before.data.type === "jump") {
          return [];
        }
        return [
          {
            event: "call",
            thread_id: 0,
            id: (counter += 1),
            ...compileBeforeEventData(frame.before.data, classmap),
          },
          {
            event: "return",
            thread_id: 0,
            id: (counter += 1),
            parent_id: counter - 1,
            elapsed:
              frame.after === null ? 0 : frame.after.time - frame.before.time,
            ...compileAfterEventData(
              frame.after === null
                ? completions.get(frame.before.data.type)
                : frame.after.data,
              classmap,
            ),
          },
        ];
      }
      if (isBundleFrame(frame)) {
        if (
          frame.begin.data.type === "bundle" ||
          !slice.has(frame.begin.index)
        ) {
          return frame.between
            .filter(isBundleFrame)
            .flatMap(
              /* c8 ignore start */ shallow
                ? loopShallow
                : loopRegular /* c8 ignore stop */,
            );
        }
        if (frame.begin.data.type === "apply") {
          const {
            file: { shallow: next_shallow },
          } = getClassmapClosure(classmap, frame.begin.data.function);
          if (shallow && next_shallow) {
            return frame.between.flatMap(loopShallow);
          }
          shallow = next_shallow;
        }
        const index = (counter += 1);
        return [
          {
            event: "call",
            thread_id: 0,
            id: index,
            ...compileBeginEventData(frame.begin.data, classmap),
          },
          ...frame.between.flatMap(shallow ? loopShallow : loopRegular),
          {
            event: "return",
            thread_id: 0,
            id: (counter += 1),
            parent_id: index,
            elapsed: frame.end === null ? 0 : frame.end.time - frame.begin.time,
            ...compileEndEventData(
              frame.end === null
                ? completions.get(frame.begin.data.type)
                : frame.end.data,
              classmap,
            ),
          },
        ];
      }
      /* c8 ignore start */
      throw new Error("invalid frame");
      /* c8 ignore stop */
    };
    const loopShallow = generateLoop(true);
    const loopRegular = generateLoop(false);
    return loopRegular(frame);
  };

  return { digestTrace };
};
