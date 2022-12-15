// @ts-check
// Module logius/headers
import {
  ISODate,
  concatDate,
  docLink,
  getIntlData,
  htmlJoinAnd,
  showError,
  showWarning,
} from "../core/utils.js";
import headersTmpl from "./templates/headers.js";
import { html } from "../core/import-maps.js";
import { lang } from "../core/l10n.js";
import { pub } from "../core/pubsubhub.js";
import sotdTmpl from "./templates/sotd.js";

export const name = "logius/headers";

const NLRespecDate = new Intl.DateTimeFormat(["nl"], {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "2-digit",
});

const noTrackStatus = [];

/**
 * @param {*} conf
 * @param {string} prop
 * @param {string | number | Date} fallbackDate
 */
function validateDateAndRecover(conf, prop, fallbackDate = new Date()) {
  const date = conf[prop] ? new Date(conf[prop]) : new Date(fallbackDate);
  // if date is valid
  if (Number.isFinite(date.valueOf())) {
    const formattedDate = ISODate.format(date);
    return new Date(formattedDate);
  }
  const msg = docLink`${prop} is not a valid date: "${conf[prop]}". Expected format 'YYYY-MM-DD'.`;
  showError(msg, name);
  return new Date(ISODate.format(new Date()));
}

export function run(conf) {
  const l10n = getIntlData(conf.localizationStrings);

  conf.isUnofficial = true;
  if (!conf.logos || !conf.useLogo) {
    conf.logos = [];
  }

  conf.specStatus = conf.specStatus ? conf.specStatus.toUpperCase() : "";
  conf.specType = conf.specType ? conf.specType.toUpperCase() : "";
  conf.pubDomain = conf.pubDomain ? conf.pubDomain.toLowerCase() : "";

  conf.hasBeenPublished = !!conf.publishDate;

  conf.licenseInfo = conf.licenses[conf.license.toLowerCase()];

  if (conf.testSuiteURI) {
    const url = new URL(conf.testSuiteURI, location.href);
    const { host, pathname } = url;
    if (
      host === "github.com" &&
      pathname.startsWith("/w3c/web-platform-tests/")
    ) {
      const msg =
        "Web Platform Tests have moved to a new Github Organization at https://github.com/web-platform-tests. ";
      const hint =
        "Please update your [`testSuiteURI`](https://respec.org/docs/#testSuiteURI) to point to the " +
        `new tests repository (e.g., https://github.com/web-platform-tests/wpt/tree/master/${conf.shortName} ).`;
      showWarning(msg, name, { hint });
    }
  }

  if (!conf.subtitle) conf.subtitle = "";
  conf.publishDate = validateDateAndRecover(
    conf,
    "publishDate",
    document.lastModified
  );
  conf.publishYear = conf.publishDate.getUTCFullYear();

  conf.isNoTrack = noTrackStatus.includes(conf.specStatus);

  if (!conf.edDraftURI) {
    conf.edDraftURI = "";
    // Thijs Brentjens: deal with editors draft links based on Github URIs
    if (conf.github) {
      // parse the org and repo name to construct a github.io URI if a github URI is provided
      // https://github.com/Logius-standaarden/respec/issues/141
      // https://github.com/{org}/{repo} should be rewritten to https://{org}.github.io/{repo}/
      const githubParts = conf.github.split("github.com/")[1].split("/");
      conf.edDraftURI = `https://${githubParts[0]}.github.io/${githubParts[1]}`;
    }
  }

  if(conf.nl_organisationPublishURL && !conf.nl_organisationPublishURL.endsWith("/")){
    conf.nl_organisationPublishURL += "/";
  }

  // pieter added subdomain
  const subdomain = conf.shortName ? `${conf.shortName}/` : ``;

  if (!conf.publishVersion) {
    conf.thisVersion = `${conf.nl_organisationPublishURL}${conf.pubDomain}/${subdomain}${specStatus}-${conf.specType.toLowerCase()}-${conf.shortName}-${concatDate(conf.publishDate)}/`;
  } else {
    conf.thisVersion = `${conf.nl_organisationPublishURL}${conf.pubDomain}/${subdomain}${conf.publishVersion}`;
  }

  if (conf.hasBeenPublished) {
    conf.latestVersion = `${conf.nl_organisationPublishURL}${conf.pubDomain}/${conf.shortName}/`;
  }

  if (conf.previousMaturity && !conf.previousStatus){
    conf.previousStatus = conf.previousMaturity;
  }

  if (
    (conf.previousPublishDate || conf.previousPublishVersion) && !conf.previousStatus) {
    conf.previousStatus = conf.specStatus;
  }

  if ((conf.previousPublishDate || conf.previousPublishVersion) && conf.previousStatus) {
    conf.previousPublishDate = validateDateAndRecover(conf,"previousPublishDate");

    const prevStatus = conf.previousStatus.toLowerCase();
    let prevType = "";
    if (conf.previousType) {
      prevType = conf.previousType.toLowerCase();
    } else {
      prevType = conf.specType.toLowerCase();
    }
    conf.prevVersion = `None${conf.previousPublishDate}`;
    if (!conf.previousPublishVersion) {
      // eslint-disable-next-line prettier/prettier
      conf.prevVersion = `${conf.nl_organisationPublishURL}${conf.pubDomain}/${subdomain}${prevStatus}-${prevType}-${conf.shortName}-${concatDate(conf.previousPublishDate)}/`;
    } else {
      // eslint-disable-next-line prettier/prettier
      conf.prevVersion = `${conf.nl_organisationPublishURL}${conf.pubDomain}/${subdomain}${conf.previousPublishVersion}/`;
    }
  }

  const peopCheck = function (it) {
    if (!it.name) {
      const msg = "All authors and editors must have a `name` property.";
      const hint =
        "See [Person](https://respec.org/docs/#person) configuration for available options.";
      showError(msg, name, { hint });
    }
  };
  if (conf.editors) {
    conf.editors.forEach(peopCheck);
  }
  if (conf.authors) {
    conf.authors.forEach(peopCheck);
  }
  conf.multipleEditors = conf.editors && conf.editors.length > 1;
  conf.multipleAuthors = conf.authors && conf.authors.length > 1;
  (conf.alternateFormats || []).forEach(it => {
    if (!it.uri || !it.label) {
      const msg = "All alternate formats must have a uri and a label.";
      showError(msg, name);
    }
  });

  if (conf.bugTracker) {
    if (conf.bugTracker.new && conf.bugTracker.open) {
      conf.bugTrackerHTML = `<a href='${conf.bugTracker.new}'>${conf.l10n.file_a_bug}</a> ${conf.l10n.open_parens}<a href='${conf.bugTracker.open}'>${conf.l10n.open_bugs}</a>${conf.l10n.close_parens}`;
    } else if (conf.bugTracker.open) {
      conf.bugTrackerHTML = `<a href='${conf.bugTracker.open}'>open bugs</a>`;
    } else if (conf.bugTracker.new) {
      conf.bugTrackerHTML = `<a href='${conf.bugTracker.new}'>file a bug</a>`;
    }
  }
  if (conf.copyrightStart && conf.copyrightStart === conf.publishYear)
    conf.copyrightStart = "";
  conf.statusText = l10n[conf.specStatus.toLowerCase()];
  conf.typeText = l10n[conf.specType.toLowerCase()];

  conf.showThisVersion = !conf.isNoTrack;
  conf.showPreviousVersion = !conf.isNoTrack && !conf.isSubmission;
  if (!conf.prevVersion) conf.showPreviousVersion = false;

  conf.dashDate = ISODate.format(conf.publishDate);
  conf.publishISODate = conf.publishDate.toISOString();
  conf.shortISODate = ISODate.format(conf.publishDate);

  const options = {
    get multipleAlternates() {
      return conf.alternateFormats && conf.alternateFormats.length > 1;
    },
    get alternatesHTML() {
      return (
        conf.alternateFormats &&
        htmlJoinAnd(
          // We need to pass a string here...
          conf.alternateFormats.map(({ label }) => label),
          (_, i) => {
            const alt = conf.alternateFormats[i];
            return html`<a
              rel="alternate"
              href="${alt.uri}"
              hreflang="${alt?.lang ?? null}"
              type="${alt?.type ?? null}"
              >${alt.label}</a
            >`;
          }
        )
      );
    },
  };

  // insert into document
  const header = headersTmpl(conf, options);
  document.body.insertBefore(header, document.body.firstChild);
  document.body.classList.add("h-entry");

  // handle SotD
  const sotd =
    document.getElementById("sotd") || document.createElement("section");
  if (!conf.isNoTrack && !sotd.id) {
    pub(
      "error",
      "A custom SotD paragraph is required for your type of document."
    );
  }
  sotd.id = sotd.id || "stod";
  sotd.classList.add("introductory");

  conf.crEnd = validateDateAndRecover(conf, "crEnd");
  conf.humanCREnd = NLRespecDate.format(conf.crEnd);

  conf.prEnd = validateDateAndRecover(conf, "prEnd");
  conf.humanPREnd = NLRespecDate.format(conf.prEnd);

  conf.perEnd = validateDateAndRecover(conf, "perEnd");
  conf.humanPEREnd = NLRespecDate.format(conf.perEnd);

  if (conf.subjectPrefix !== "")
    conf.subjectPrefixEnc = encodeURIComponent(conf.subjectPrefix);

  html.bind(sotd)`${populateSoTD(conf, sotd)}`;

  if (!conf.implementationReportURI && (conf.isCR || conf.isPR || conf.isRec)) {
    pub(
      "error",
      "CR, PR, and REC documents need to have an `implementationReportURI` defined."
    );
  }
}

/**
 * @param {*} conf
 * @param {HTMLElement} sotd
 */
function populateSoTD(conf, sotd) {
  if (!conf.nl_organisationName) {
    conf.nl_organisationName = "";
  }
  const options = {
    ...collectSotdContent(sotd, conf),
    get specDocument() {
      let article = "";
      if (lang.toLowerCase() === "nl") {
        conf.specType === "IM" ? (article = "het ") : (article = "de ");
      }
      return `${article} ${conf.typeStatus.toLowerCase()}`;
    },
    get emailComments() {
      return `${conf.nl_emailcomments}`;
    },
    get emailCommentsMailto() {
      return `mailto:${this.emailComments}`;
    },
    get emailCommentsMailtoSubject() {
      const fragment = conf.subjectPrefix
        ? `?subject=${encodeURIComponent(conf.subjectPrefix)}`
        : "";
      return this.emailCommentsMailto + fragment;
    },
  };
  const template = sotdTmpl;
  return template(conf, options);
}

/**
 * @param {HTMLElement} sotd
 * @param isTagFinding
 */
function collectSotdContent(sotd, { isTagFinding = false }) {
  const sotdClone = sotd.cloneNode(true);
  const additionalContent = document.createDocumentFragment();
  // we collect everything until we hit a section,
  // that becomes the custom content.
  while (sotdClone.hasChildNodes()) {
    if (
      isElement(sotdClone.firstChild) &&
      sotdClone.firstChild.localName === "section"
    ) {
      break;
    }
    additionalContent.appendChild(sotdClone.firstChild);
  }
  if (isTagFinding && !additionalContent.hasChildNodes()) {
    pub(
      "warn",
      "ReSpec does not support automated SotD generation for TAG findings, " +
        "please add the prerequisite content in the 'sotd' section"
    );
  }
  return {
    additionalContent,
    // Whatever sections are left, we throw at the end.
    additionalSections: sotdClone.childNodes,
  };
}

/**
 * @param {Node} node
 * @return {node is Element}
 */
function isElement(node) {
  return node.nodeType === Node.ELEMENT_NODE;
}
