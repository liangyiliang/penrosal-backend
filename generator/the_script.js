const writeToErrorBox = (message) => {
  document.getElementById("errorbox").innerText = message;
}
const writeToStatusBox = (message) => {
  document.getElementById("status").innerText = message;
}

writeToStatusBox("Generating");
const urlParams = new URLSearchParams(location.search);
if (
  urlParams.has("dsl") &&
  urlParams.has("sty") &&
  urlParams.has("sub") &&
  urlParams.has("variation")
) {
  const dsl = urlParams.get("dsl");
  const sty = urlParams.get("sty");
  const sub = urlParams.get("sub");
  const variation = urlParams.get("variation");
  const {
    compileTrio,
    prepareState,
    RenderStatic,
    stepUntilConvergence,
    showError,
  } = require("../penrose/packages/core/build/dist/index");
  const prog = {
    domain: dsl,
    style: sty,
    substance: sub,
    variation: variation,
  };
  const compRes = compileTrio(prog);

  async function fetchResolver(path) {
    const response = await fetch(path);
    if (!response.ok) {
      console.log(`could not fetch ${path}`);
      return undefined;
    }
    return await response.text();
  }

  const run = async () => {
    if (compRes.isOk()) {
      const state = await prepareState(compRes.value);
      const optimized = stepUntilConvergence(state);
      if (optimized.isOk()) {
        const rendered = await RenderStatic(optimized.value, fetchResolver);
        document.getElementById("svg").appendChild(rendered);
        writeToStatusBox("Completed");
      } else {
        writeToErrorBox("Runtime Error:\n" + showError(optimized.error).toString());
        writeToStatusBox("Failed");
      }
    } else {
      writeToErrorBox("Compilation error:\n" + showError(compRes.error).toString());
      writeToStatusBox("Failed");
    }
  };
  run().then(() => {
    console.log("done");
  });
} else {
  writeToErrorBox("Invalid request");
  writeToStatusBox("Failed");
}
