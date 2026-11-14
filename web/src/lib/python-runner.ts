"use client";

export interface TestResult {
  description: string;
  ok: boolean;
  got: string;
}

type Listener = (msg: { type: string; text?: string; results?: TestResult[]; crashed?: boolean }) => void;

/** How long a run may take before we stop it (protects against infinite loops). */
export const RUN_TIMEOUT_MS = 8000;

/**
 * Owns one Pyodide Web Worker. `stop()` terminates it instantly and the next
 * run starts a fresh one — that's how Stop and the infinite-loop guard work.
 */
export class PythonRunner {
  private worker: Worker | null = null;
  private seq = 0;
  private listeners = new Map<number, Listener>();

  private ensure(): Worker {
    if (!this.worker) {
      this.worker = new Worker("/py-worker.js");
      this.worker.onmessage = (e) => {
        const { id, ...msg } = e.data;
        this.listeners.get(id)?.(msg);
      };
    }
    return this.worker;
  }

  /** Start downloading Python in the background (only when a code activity opens). */
  warmUp(onReady: () => void, onError: (text: string) => void) {
    const id = ++this.seq;
    this.listeners.set(id, (msg) => {
      if (msg.type === "ready") onReady();
      if (msg.type === "error") onError(msg.text ?? "Python failed to load");
      this.listeners.delete(id);
    });
    this.ensure().postMessage({ id, type: "init" });
  }

  run(
    code: string,
    stdin: string,
    onOutput: (stream: "stdout" | "stderr", text: string) => void,
  ): Promise<{ ok: boolean; error?: string; timedOut?: boolean }> {
    const id = ++this.seq;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.stop();
        resolve({ ok: false, timedOut: true, error: `Stopped after ${RUN_TIMEOUT_MS / 1000} seconds. Is there a loop that never ends?` });
      }, RUN_TIMEOUT_MS);
      this.listeners.set(id, (msg) => {
        if (msg.type === "stdout" || msg.type === "stderr") onOutput(msg.type, msg.text ?? "");
        if (msg.type === "done" || msg.type === "error") {
          clearTimeout(timer);
          this.listeners.delete(id);
          resolve(msg.type === "done" ? { ok: true } : { ok: false, error: msg.text });
        }
      });
      this.ensure().postMessage({ id, type: "run", code, stdin });
    });
  }

  test(
    code: string,
    tests: { expr: string; expected: string; description: string }[],
  ): Promise<{ results: TestResult[]; error?: string; timedOut?: boolean }> {
    const id = ++this.seq;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.stop();
        resolve({ results: [], timedOut: true, error: "The tests took too long — is there a loop that never ends?" });
      }, RUN_TIMEOUT_MS);
      this.listeners.set(id, (msg) => {
        if (msg.type === "tests" || msg.type === "error") {
          clearTimeout(timer);
          this.listeners.delete(id);
          resolve({ results: msg.results ?? [], error: msg.crashed || msg.type === "error" ? msg.text : undefined });
        }
      });
      this.ensure().postMessage({ id, type: "test", code, tests, stdin: "" });
    });
  }

  stop() {
    this.worker?.terminate();
    this.worker = null;
    this.listeners.clear();
  }
}
