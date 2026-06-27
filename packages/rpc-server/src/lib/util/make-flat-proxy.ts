export function makeFlatProxy<T extends object>(targetObj: T) {
  function makeProxy(currentPath: any) {
    return new Proxy(
      {},
      {
        get(_, prop) {
          const newPath = currentPath
            ? `${currentPath}.${prop.toString()}`
            : prop;

          // If the exact flat key exists in our original object, return the value
          if (newPath in targetObj) return targetObj[newPath as keyof T];

          // Otherwise, return a new proxy to allow further chaining
          return makeProxy(newPath);
        },
      }
    );
  }

  return makeProxy('');
}
