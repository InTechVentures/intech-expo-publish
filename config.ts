import { IBranchEnvironment, IBranchEnvironments } from "./interfaces";

// Environments - change .env file and releaseChannel based on branch name
export const BRANCH_ENVIRONMENTS: IBranchEnvironments = {
  master: { env: ".env.production", releaseChannel: "default" },
  develop: { env: ".env.staging", releaseChannel: "staging" },
};

// Default environment to use if branch is not in 'branchEnvironments'
export const DEFAULT_ENVIRONMENT: IBranchEnvironment = { env: ".env.staging" };
