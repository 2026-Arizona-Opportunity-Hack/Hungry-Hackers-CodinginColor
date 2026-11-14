/* global importScripts, loadPyodide */
// Runs student Python with Pyodide inside a Web Worker, so a `while True:`
// can never freeze the page: the main thread just terminates this worker.
// No server, no account, no API key.

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
importScripts(PYODIDE_URL + "pyodide.js");

let pyodidePromise = null;
function getPyodide() {
  if (!pyodidePromise) pyodidePromise = loadPyodide({ indexURL: PYODIDE_URL });
  return pyodidePromise;
}

function friendlyError(err) {
  const text = String((err && err.message) || err);
  // Keep the useful tail of a Python traceback and drop Pyodide internals.
  const lines = text.split("\n").filter((l) => !l.includes("/lib/python") && !l.includes("_pyodide"));
  return lines.slice(-4).join("\n").trim();
}

self.onmessage = async (event) => {
  const { id, type, code, stdin, tests } = event.data;
  let py;
  try {
    py = await getPyodide();
  } catch {
    self.postMessage({ id, type: "error", text: "Python couldn't load. Check your internet connection and try again." });
    return;
  }
  if (type === "init") {
    self.postMessage({ id, type: "ready" });
    return;
  }

  const quiet = type === "test";
  py.setStdout({ batched: (s) => !quiet && self.postMessage({ id, type: "stdout", text: s }) });
  py.setStderr({ batched: (s) => !quiet && self.postMessage({ id, type: "stderr", text: s }) });
  const lines = (stdin || "").split("\n");
  let next = 0;
  py.setStdin({ stdin: () => (next < lines.length ? lines[next++] : undefined), autoEOF: true });

  const ns = py.globals.get("dict")();
  try {
    py.runPython(code, { globals: ns });
  } catch {
    self.postMessage({ id, type: quiet ? "tests" : "error", text: friendlyError(err), results: quiet ? [] : undefined, crashed: true });
    ns.destroy();
    return;
  }

  if (type === "test") {
    const results = (tests || []).map((t) => {
      try {
        const ok = py.runPython(`bool((${t.expr}) == (${t.expected}))`, { globals: ns });
        const got = py.runPython(`repr(${t.expr})`, { globals: ns });
        return { description: t.description, ok: Boolean(ok), got: String(got) };
      } catch {
        return { description: t.description, ok: false, got: friendlyError(err) };
      }
    });
    self.postMessage({ id, type: "tests", results });
  } else {
    self.postMessage({ id, type: "done" });
  }
  ns.destroy();
};
