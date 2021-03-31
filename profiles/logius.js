"use strict";
// In case everything else fails, we want the error
window.addEventListener("error", ev => {
  console.error(ev.error, ev.message, ev);
});

const modules = [
  // order is significant
  import("../src/core/base-runner.js"),
  import("../src/core/ui.js"),
  import("../src/core/location-hash.js"),
  import("../src/core/l10n.js"),
  import("../src/logius/defaults.js"), // done, for now
  import("../src/core/style.js"),
  import("../src/logius/style.js"), // done for now, still some wip
  import("../src/w3c/l10n.js"), // solved handhaaf w3c versie ipv geonovum
  import("../src/core/github.js"),
  import("../src/logius/github.js"), // try to revert some props
  import("../src/core/data-include.js"),
  import("../src/logius/splitmarkdownheaders.js"), // todo check
  import("../src/core/markdown.js"),
  import("../src/logius/fix-md-elements.js"), // todo check
  import("../src/core/reindent.js"), // nothing changed but this module is in geonovum profile at line 3
  import("../src/logius/releasetitle.js"), // todo an idea to add release tag to title
  import("../src/core/title.js"),
  import("../src/w3c/level.js"), // todo check if this must be skipped
  import("../src/w3c/group.js"), // todo check if this must be skipped
  import("../src/logius/headers.js"), // doing
  import("../src/w3c/abstract.js"),
  import("../src/core/data-transform.js"),
  import("../src/core/data-abbr.js"),
  import("../src/logius/inlines.js"), // todo geonovum, only copied nl section
  import("../src/logius/conformance.js"), // merged geonovum variant into w3c version
  import("../src/core/dfn.js"),
  import("../src/core/pluralize.js"),
  import("../src/core/examples.js"),
  // import("../src/core/issues-notes.js"),
  import("../src/logius/issues-notes.js"),
  // todo insert requirements ?
  import("../src/core/best-practices.js"),
  import("../src/core/figures.js"),
  import("../src/core/webidl.js"), // todo skipped by geonovum
  import("../src/core/biblio.js"),
  import("../src/core/link-to-dfn.js"),
  import("../src/core/xref.js"),
  import("../src/core/data-cite.js"),
  import("../src/core/webidl-index.js"),
  import("../src/core/render-biblio.js"),
  import("../src/core/dfn-index.js"),
  import("../src/core/contrib.js"),
  import("../src/core/fix-headers.js"),
  import("../src/core/structure.js"),
  import("../src/core/informative.js"),  //solved handhaaf core version ipv  geonovum version
  import("../src/core/id-headers.js"),
  import("../src/core/caniuse.js"),
  import("../src/core/mdn-annotation.js"),
  // todo geonovum insert leafletfigures.js 
  import("../src/ui/save-html.js"),
  import("../src/ui/search-specref.js"),
  import("../src/ui/search-xref.js"),
  import("../src/ui/about-respec.js"),
  import("../src/core/seo.js"),
  import("../src/logius/seo.js"), // check
  import("../src/core/highlight.js"),
  import("../src/core/webidl-clipboard.js"), // skipped by geonovum
  import("../src/core/data-tests.js"),
  import("../src/core/list-sorter.js"),
  import("../src/core/highlight-vars.js"),
  import("../src/core/dfn-panel.js"),
  import("../src/core/data-type.js"),
  import("../src/core/algorithms.js"),
  import("../src/core/anchor-expander.js"),
  import("../src/core/custom-elements/index.js"),
  /* Linters must be the last thing to run */
  import("../src/core/linter.js"),
  import("../src/core/a11y.js"),
];

async function domReady() {
  if (document.readyState === "loading") {
    await new Promise(resolve =>
      document.addEventListener("DOMContentLoaded", resolve)
    );
  }
}

(async () => {
  const [runner, { ui }, ...plugins] = await Promise.all(modules);
  try {
    ui.show();
    await domReady();
    await runner.runAll(plugins);
  } finally {
    ui.enable();
  }
})().catch(err => {
  console.error(err);
});