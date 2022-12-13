# Intro
In order to install the Hyperscale Client Library, you first need to generate an access token to github. Follow these steps in order to generate the access token:
1. Sign in to github.com with your personal account (create one if you don't have one).
2. Go to your profile settings --> Developer settings
3. Under 'Personal access tokens' go to 'Tokens (classic)'
4. Go to 'Generate new token (classic)'
5. Check 'read:packages'
6. Generate token
7. Copy token

# Install
Set registery for synamedia namespace
```bash
npm config set @Synamedia:registry https://npm.pkg.github.com
npm config set -- //npm.pkg.github.com/:_authToken <your access token>
```

Install using npm
```bash
npm install @Synamedia/hs-sdk
```
