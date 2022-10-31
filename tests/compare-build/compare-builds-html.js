const { execSync } = require("node:child_process");
const fs = require("fs");
const https = require("https");
const path = require("path");
const htmlCompare = require("html-compare");

const currentSnapshotPath = path.join(__dirname, "/currentSnapshot.html");
const stableSnapshotPath = path.join(__dirname, "/stableSnapshot.html");
const logFilePath = path.join(__dirname, "/html-test-log");
const stableLogiusProfileUrl = path.join(__dirname + "/stableLogiusProfile.js");
const writeStream = fs.createWriteStream(logFilePath, { flags: "w" });
const profileURL = "https://publicatie.centrumvoorstandaarden.nl/respec/builds/respec-logius.js";
let writeToLog = false;

//check if createLog flag is set
const args = process.argv.slice(2);
if (args[0] === "--createLog") {
  writeToLog = true;
}

//execute functions declared below
console.log("test started");
downloadStableLogiusBuild(createStableSnapshot);
createCurrentBuild(createCurrentSnapshot);
compareSnapshots();
console.log("test ended");


//download current logius profile from url and save it as a .js file
function downloadStableLogiusBuild(callback) {
  const profile = fs.createWriteStream(stableLogiusProfileUrl);
  https.get(profileURL, function(response) {
    response.pipe(profile);

    // after download completed close filestream
    profile.on("finish", () => {
      profile.close();
      callback();
    });
  });
  console.log("Download logiusProfile Completed");
}

// create snapshot with the build downloaded from stableLogiusProfileUrl
function createStableSnapshot() {
  execSync(
    "npx respec --localhost --src tests/compare-build/logius-build-stable.html --out tests/compare-build/stableSnapshot.html",
    (error, stdout, stderr) => {
      console.log(error);
      console.log(stdout);
      console.log(stderr);
    }
  );
}

function createCurrentBuild(callback) {
  execSync(
    "node ./tools/builder.js logius",
    (error, stdout, stderr) => {
      console.log(error);
      console.log(stdout);
      console.log(stderr);
    }
  );
  callback();
}

function createCurrentSnapshot() {
// create snapshot with the current build in builds/respec-logius.js
  execSync(
    "npx respec --localhost --src tests/compare-build/logius-build-current.html --out tests/compare-build/currentSnapshot.html",
    (error, stdout, stderr) => {
      console.log(error);
      console.log(stdout);
      console.log(stderr);
    }
  );
}

//compare snapshot html from 2 different builds
function compareSnapshots() {
// load stable snapshot
  const stable = fs.readFileSync(stableSnapshotPath, "utf8");

// load current snapshot
  const current = fs.readFileSync(currentSnapshotPath, "utf8");

  const result = htmlCompare.compare(stable, current);
  if (result.different) {
    if (writeToLog) {
      writeStream.write("HTML fragments are different, changes:" + "\n");
      result.changes.map(change => {
        // htmlCompare adds ESC[39m format colors to the text, regex is to make the text readable in the log file
        writeStream.write(
          `${`In node ${change.before.parentPath}:\n\t${change.message}`.replace(
            // eslint-disable-next-line no-control-regex
            /\u001b[^m]*?m/g,
            ""
          )}\n`
        );
      });
      console.log(`Log file written to: ${logFilePath}`);
    } else {
      console.log("HTML fragments are different, changes:");
      result.changes.map(change => {
        console.log(`In node ${change.before.parentPath}:\n\t${change.message}`);
      });
    }
  } else {
    console.log("No changes found.");
  }
}

