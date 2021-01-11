import { exec, spawn } from "child_process";
import {
  renameSync,
  readFile,
  readFileSync,
  copyFileSync,
  writeFileSync,
} from "fs";

import { red, gray, blue } from "chalk";
import fetch from "node-fetch";

import { ISpawnProcess } from "./interfaces";

/**
 * Run a command
 * @param command The command to run
 */
export function execute(command: string): Promise<string> {
  return new Promise((res, rej) => {
    exec(command, (_, stdout, stderr) => {
      res(stdout || stderr);
    });
  });
}

/**
 * Spawn a child process
 * @param processName The name of the process
 * @param args Array of arguments to pass to the process
 */
export function spawnProcess(
  processName: string,
  ...args: string[]
): Promise<ISpawnProcess> {
  return new Promise((res) => {
    const program = spawn(processName, args);

    let buffer = "";
    program.stdout.on("data", (data) => {
      buffer += data;
      process.stdout.write(`${gray(data)}`);
    });

    program.stderr.on("data", (data) => process.stderr.write(`${data}`));
    program.on("exit", (code) => res({ code, data: buffer }));
  });
}

/**
 * Fetch the installed Expo SDK version
 */
export async function fetchExpoSdkVersion(): Promise<string | null> {
  return await new Promise((res) =>
    readFile("./package.json", (err, data) => {
      if (err) return null;

      const appPackage = JSON.parse(`${data}`);
      return res(`${appPackage.dependencies.expo.match(/\d\d/g)[0]}.0.0`);
    })
  );
}

/**
 * Fetch the app manifest from Expo for a specific release channel
 * @param sdkVersion SDK version to use
 * @param releaseChannel The channel to fetch the version
 */
export async function fetchManifest(
  sdkVersion: string,
  releaseChannel: string
) {
  try {
    console.log(
      `https://exp.host/@${process.env.EXPO_ACCOUNT}/${process.env.EXPO_APP}/index.exp?release-channel=${releaseChannel}&sdkVersion=${sdkVersion}`
    );
    const response = await fetch(
      `https://exp.host/@${process.env.EXPO_ACCOUNT}/${process.env.EXPO_APP}/index.exp?release-channel=${releaseChannel}&sdkVersion=${sdkVersion}`
    );

    return await response.json();
  } catch (e) {
    return false;
  }
}

export async function getReleaseChannel(branchName: string): Promise<string> {
  return (process.env.releaseChannel ? process.env.releaseChannel : branchName)
    .replace(/\//g, "-")
    .trim();
}

/**
 * Fail the deployment with an error
 * @param error The error to fail with
 */
export function abort(error: string) {
  return Promise.reject(red(`\n\n${error}\n\n`));
}

/**
 * Get the name of the current brnahc
 */
export async function getBranchName() {
  return await execute("git branch --show-current");
}

/**
 * Revert original environment and stash app.json changes made by deployment
 */
export async function cleanup(shouldStashChanges: boolean) {
  // Stash app.json and .env.production changes
  if (shouldStashChanges) await execute("git stash");
}

/**
 * Log messages to the console
 * @param messages An array of messages to log
 */
export const log = (...messages: string[]) => console.log(blue(...messages));
