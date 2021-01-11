# intech-expo-publish

## About

This project aims to allow you to safely publish your app changes to Expo by verifying your local code is pushed & pulled and automatically switching environments and publishing to the correct Expo release channel based on the branch name.

It also verifies that you are logged into the correct Expo account for the particular project using environment variables.

Once the script has ran successfully, you are presented with a QR code which will open the Expo app on your release channel when scanned.

## Installation

1. Run the following command to install the package and its peer dependencies into your project (works with npm or yarn)

   `npx install-peerdeps --dev intech-expo-publish`

2. Add the project to your package.json as a script

   ```json
   ...
   "scripts": {
       ...
           "publish-expo": "ts-node --script-mode ./node_modules/intech-expo-publish"
       ...
   }
   ...
   ```

3. You must create a production and staging .env file for your project with the relevant variables. These must both contain the Expo account and Expo app name you want to use for your app to make sure your build is uploaded to the correct account.

   ```
   # .env.staging
   EXPO_ACCOUNT="youraccount"
   EXPO_APP="yourapp"

   # .env.production
   EXPO_ACCOUNT="youraccount"
   EXPO_APP="yourapp"
   ```

## Usage

Running this command will perform all necessary checks, switch your local environment and deploy to the relevant release channel depending on your current branch.

- `yarn publish-expo`

| Branch name            | Environment file | Release channel        |
| ---------------------- | ---------------- | ---------------------- |
| master                 | .env.production  | default                |
| develop                | .env.staging     | staging                |
| manolis/feature-branch | .env.staging     | manolis_feature-branch |
