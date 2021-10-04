<p align="center">
<h1 align="center">Hyperscale - SDK</h1>
<p align="center">


# Installation

### Step 1:

Create a file called .npmrc / .yarnrc in your project and add the below line.

`"@ip-synamedia:registry=https://artifactory01.engit.synamedia.com/artifactory/api/npm/spvss-cloud-ci-npm/"`

### Step 2:

This library can be installed using npm/yarn with the below commands.

- npm:  `npm install @ip-synamedia/hs-sdk --save`
- yarn: `yarn add @ip-synamedia/hs-sdk`

# Usage

Import and use required logic. 

# Local Usage and Debugging

You can point your importing project to use your local code of this repo by creating an NPM link :
1. In this root of this project run:
first install dependencies
```bash
npm install OR yarn
```


```bash
npm link
```
OR
```bash
yarn link
```

Then in your importing project who uses this repo run:
```bash
npm link @ip-synamedia/hs-sdk
```
OR
```bash
yarn link "@ip-synamedia/hs-sdk"
```
It will now use the code on your local machine.

```
import { init } from '@ip-synamedia/hs-sdk/dist/api';

init();
```

# Contribute to the Library

### Step 1:

Navigate to `src/`

### Step 2:

Contribute your code under `api`  

### Step 3:

Navigate to `src/api.js` and export your contribution (if needed)