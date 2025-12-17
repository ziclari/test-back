export function interpolate(template, state) {
  if (typeof template !== "string") return template;

  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, expr) => {
    try {
      const fn = new Function("ctx", `with (ctx) { return ( ${expr} ); }`);
      return fn(state);
    } catch (e) {
      return "";
    }
  });
}
