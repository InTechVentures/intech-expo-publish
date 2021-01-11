### intech-expo-deployer

This project aims to allow you to safely publish your app changes to Expo by verifying your local code is pushed & pulled and automatically switching environments and publishing to the correct Expo release channel based on the branch name.

It also verifies that you are logged into the correct Expo account for the particular project using environment varaibles.

Once the script has ran successfully, you are presented with a QR code which will open the Expo app on your release channel when scanned.

## Installation

To use the script, you s

## Usage

`yarn deploy`

This will perform all necessary checks, switch your local environment and deploy to the relevant release channel

| Branch name            | Environment file | Release channel        |
| ---------------------- | ---------------- | ---------------------- |
| master                 | .env.production  | default                |
| develop                | .env.staging     | staging                |
| manolis/feature-branch | .env.staging     | manolis_feature-branch |
