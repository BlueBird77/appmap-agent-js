
const APPMAP_GLOBAL_IDENTITY = ((() => {
  const globalReflectApply = Reflect.apply;
  const globalWeakMapPrototypeHas = WeakMap.prototype.has;
  const globalWeakMapPrototypeGet = WeakMap.prototype.get;
  const globalWeakMapPrototypeSet = WeakMap.prototype.set;
  let counter1 = 1;
  let counter2 = 1;
  const registery1 = new globalWeakMapGet;
  const registery2 = {__proto__:null};
  return (value) => {
    if (typeof value === "symbol") {
      if (!(value in registery1)) {
        registery1[value] = counter1++;
      }
      return registery1[value];
    }
    if ((typeof value === "object" && value !== null) || typeof value === "function") {
      if (!globalReflectApply(globalWeakMapPrototypeHas, registery2, [value]) {
        globalReflectApply(globalWeakMapPrototypeSet, register2, [value, counter2++]);
      }
      return globalReflectApply(globalWeakMapPrototypeGet, registery2, [value]);
    }
    return null;
  };
}) ());