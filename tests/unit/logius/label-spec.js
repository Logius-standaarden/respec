"use strict";

import { flushIframes, makePluginDoc } from "../SpecHelper.js";

describe("label-plugin", () => {
  afterAll(flushIframes);

  const plugins = ["/src/logius/label.js"];
  const config = {
    nl_organisationName: "Logius",
    useLabel: true,
    specStatus: "cv",
    labelText: {
      nl: {
        cv: `Goedgekeurde consultatieversie`,
      },
    },
    labelColorTable: {
      cv: "#2fdaed",
    },
  };
  const body = `<section id="section1"></section>`;

  const makeDoc = () => makePluginDoc(plugins, { config, body });

  it("creates sideLabel div", async () => {
    const doc = await makeDoc();
    expect(doc.querySelector(".sidelabel")).not.toBeNull();
  });

  it("has correct innerText", async () => {
    const doc = await makeDoc();
    expect(doc.querySelector(".sidelabel").innerText).toBe(
      "Logius - Goedgekeurde consultatieversie"
    );
  });

  it("does not create a sideLabel div if useLabel = false", async () => {
    config.useLabel = false;
    const doc = await makeDoc();
    expect(doc.querySelector(".sidelabel")).toBeNull();
    config.useLabel = true;
  });
});
