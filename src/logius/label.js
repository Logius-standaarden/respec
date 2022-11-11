import css from "../styles/label.css.js";

export const name = "logius/label";

export async function run(conf) {
  await createLabel(conf);
}

async function createLabel(conf) {
  if (!conf.useLabel) {
    return;
  }
  const sideLabel = document.createElement("div");

  const labelColor = conf.labelColor[conf.specStatus.toLowerCase()];
  sideLabel.innerHTML = `${conf.nl_organisationName} ${conf.typeText} - ${conf.statusText}`;

  sideLabel.setAttribute("class", "sidelabel");
  sideLabel.setAttribute("style", `background-color: ${labelColor};`);
  document.body.appendChild(sideLabel);

  if (document.querySelector(".sidelabel")) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }
}
