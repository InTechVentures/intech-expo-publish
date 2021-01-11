export interface IBranchEnvironment {
  env: string;
  releaseChannel?: string;
}

export interface IBranchEnvironments {
  [branchName: string]: IBranchEnvironment;
}

export interface ISpawnProcess {
  code: number | null;
  data: string;
}
