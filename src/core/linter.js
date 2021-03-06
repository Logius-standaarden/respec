// @ts-check
/**
 * Module core/linter
 *
 * Core linter module. Exports a linter object.
 */
import { showWarning } from "./utils.js";
export const name = "core/linter";

/** @type {WeakMap<Linter, { rules: Set<import("./LinterRule").default> }>} */
const privates = new WeakMap();

class Linter {
  constructor() {
    privates.set(this, {
      rules: new Set(),
    });
  }
  get rules() {
    return privates.get(this).rules;
  }
  /**
   * @param  {...import("./LinterRule").default} newRules
   */
  register(...newRules) {
    newRules.forEach(newRule => this.rules.add(newRule));
  }
  async lint(conf, doc = window.document) {
    const promisesToLint = [...privates.get(this).rules].map(rule =>
      toLinterWarning(rule.lint(conf, doc))
    );
    await promisesToLint;
  }
}

const linter = new Linter();
export default linter;

const baseResult = {
  name: "unknown",
  description: "",
  occurrences: 0,
  howToFix: "",
  offendingElements: [], // DOM Nodes
  help: "", // where to get help
};

/**
 * @typedef {import("./LinterRule").LinterResult} LinterResult
 * @param {LinterResult | Promise<LinterResult>} [resultPromise]
 */
async function toLinterWarning(resultPromise) {
  const result = await resultPromise;
  if (!result) {
    return;
  }
  const output = { ...baseResult, ...result };
  const {
    description,
    help,
    howToFix,
    name: linterName,
    occurrences,
    offendingElements,
  } = output;
  const msg = offendingElements.length
    ? description
    : `${description} (Count: ${occurrences})`;
  const plugin = `${name}/${linterName}`;
  const hint = `${howToFix} ${help}`;
  showWarning(msg, plugin, { hint, elements: offendingElements });
}

export function run(conf) {
  if (conf.lint === false) {
    return; // nothing to do
  }
  // return early, continue processing other things
  (async () => {
    await document.respec.ready;
    try {
      await linter.lint(conf, document);
    } catch (err) {
      console.error("Error ocurred while running the linter", err);
    }
  })();
}
