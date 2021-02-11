import { copyFileSync, readFileSync, writeFileSync } from "fs";

import { green, whiteBright } from "chalk";
import { toString as qrCode } from "qrcode";
import { inc as incrementVersion } from "semver";

import { BRANCH_ENVIRONMENTS, DEFAULT_ENVIRONMENT } from "./config";
import {
  abort,
  execute,
  fetchExpoSdkVersion,
  fetchManifest,
  log,
  spawnProcess,
} from "./util";

/**
 * Verify there are no unpushed changes
 */
export async function checkGit() {
  log("Checking for local changes...");
  if (await execute("git diff"))
    return abort("Commit or stash your local changes before continuing");

  if (await execute("git diff --cached"))
    return abort("Commit or stash your local changes before continuing");

  if ((await execute("git rev-list @{upstream}.. -n 1")) !== "")
    return abort("Push your changes before deploying");

  return true;
}

/**
 * Switch to the correct .env file depending on the current branch and backup local .env
 */
export async function switchEnvironment(branchName: string) {
  // Switch environments
  log("Backing up production environment...");

  // Swap local .env for the correct one for the branch
  const useEnvironment = BRANCH_ENVIRONMENTS[branchName]
    ? BRANCH_ENVIRONMENTS[branchName]
    : DEFAULT_ENVIRONMENT;

  log(`Switching to environment '${useEnvironment.env}'...`);
  copyFileSync(useEnvironment.env, "./.env.production");
  require("dotenv").config({ path: "./.env.production" });
}

/**
 * Verify you're logged into the correct Expo account for the project
 */
export async function verifyExpoAccount() {
  // Verify you're logged in as the correct account (according to the environment)
  log("Verifying Expo account...");
  const expoAccount = (await execute("expo whoami")) || "";

  if (!expoAccount || expoAccount.match(/Not logged in/g))
    return abort(
      "You are not logged in with an Expo account. Login with 'expo login'"
    );
  if (expoAccount.trim() !== process.env.EXPO_ACCOUNT)
    return abort(
      `You are not logged in to the correct Expo account. You are logged in as '${expoAccount.trim()}' when you should be logged in as '${
        process.env.EXPO_ACCOUNT
      }'`
    );
}

/**
 * Fetch the latest SDK version from Expo and fail if not found
 */
export async function fetchSdkVersion() {
  const sdkVersion: string | null = await fetchExpoSdkVersion();
  if (!sdkVersion)
    return abort(
      "Failed to read package.json. Please check the file is formatted correctly"
    );

  return sdkVersion;
}

/**
 * Bump the version in app.json
 * @param sdkVersion Project SDK version
 * @param releaseChannel Release channel manifest version to use
 */
export async function bumpVersion(
  sdkVersion: string,
  releaseChannel: string
): Promise<void> {
  // Fetch the last published Expo version for the release channel
  log(`Fetching last published build on release channel '${releaseChannel}'`);
  let manifest = await fetchManifest(sdkVersion, releaseChannel);
  if (!manifest) {
    log(
      `Could not fetch latest published version for release channel '${releaseChannel}'\n` +
        "Fetching last published build on release channel 'default'"
    );
    manifest = await fetchManifest(sdkVersion, "default");
  }

  if (!manifest) {
    log(
      `Could not fetch last published version from Expo on default release channel.\n
      Has a release on the default release channel happened on this SDK version?\n
      Defaulting to version 1.0.0`
    );

    manifest = {
      version: "1.0.0",
    };
  }
  // Bump version
  const newVersion = incrementVersion(manifest.version, "patch");
  log(`Bumping app version to ${newVersion}...`);
  const appJsonFilePath = "./app.json";
  const app = JSON.parse(readFileSync(appJsonFilePath, "utf8"));

  app.expo.version = newVersion;
  writeFileSync(appJsonFilePath, JSON.stringify(app, null, 2));
}

/**
 * Build & publish the build to Expo
 * @param releaseChannel The release channel to use
 */
export async function publish(releaseChannel: string) {
  log(`Publishing app to release channel '${releaseChannel}'...`);

  const { code, data } = await spawnProcess(
    "expo",
    "publish",
    "--release-channel",
    releaseChannel,
    "-c"
  );

  if (code !== 0)
    return abort(`Expo process finished with non-zero exit code (${code})`);

  const manifestMatch = data.match(/Manifest: (https:\/\/\S*)/);
  if (!manifestMatch) {
    return abort("Could not fetch manifest URL from 'expo publish' output");
  }

  const manifestUrl = manifestMatch[1];
  qrCode(manifestUrl, { type: "terminal", scale: 1 }, (err, url) => {
    console.log(url);
  });

  console.log(green("\nSuccesssfully deployed app to Expo!"));
  console.log(green("Manifest URL:"), whiteBright(manifestUrl));
}
