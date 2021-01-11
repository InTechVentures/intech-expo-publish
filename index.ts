import { cleanup, getBranchName, getReleaseChannel, log } from "./util";

import {
  bumpVersion,
  checkGit,
  fetchSdkVersion,
  publish,
  switchEnvironment,
  verifyExpoAccount,
} from "./deploy";

/**
 * Check the build before publish to Expo and return the release channel
 */
async function preliminaryChecks(): Promise<[string, string]> {
  // Verify there aren't any git changes
  await checkGit();

  // Fetch branch name and Sdk version
  const branchName = await getBranchName();
  const sdkVersion = await fetchSdkVersion();

  // Switch to the correct environment for the branch
  await switchEnvironment(branchName);

  // Check you're logged into the correct Expo account
  await verifyExpoAccount();

  // Get the release channel we should use for this deployment
  const releaseChannel = await getReleaseChannel(branchName);
  return [sdkVersion, releaseChannel];
}

async function deploy(sdkVersion: string, releaseChannel: string) {
  // Bump the version in app.json
  await bumpVersion(sdkVersion, releaseChannel);

  // Publish to Expo
  await publish(releaseChannel);
}

(async () => {
  log("\nBeginning deployment...");

  const verifyBuild = await preliminaryChecks().catch((error: string) => {
    console.log(error);
    cleanup(false);
  });

  if (!verifyBuild) return;

  await deploy(...verifyBuild).catch((error: string) => {
    console.log(error);
    cleanup(true);
  });
})();
