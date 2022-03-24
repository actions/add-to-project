# actions/add-to-project

Use this action to automatically add issues to a GitHub Project. Note that this
is for [GitHub Projects
(beta)](https://docs.github.com/en/issues/trying-out-the-new-projects-experience/about-projects),
not the original GitHub Projects.

## Current Status

![Build status](https://github.com/github/add-to-project/workflows/test/badge.svg)

🚨 **This action is a work-in-progress. Please do not use it except for
experimentation until a release has been prepared.** 🚨

## Usage

_See [action.yml](action.yml) for [metadata](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions) that defines the inputs, outputs, and runs configuration for this action._

_For more information about workflows, see [Using workflows](https://docs.github.com/en/actions/using-workflows)._

To use the action, create a workflow that runs when issues are opened in your
repository. Run this action in a step, optionally configuring any filters you
may want to add, such as only adding issues with certain labels.

```yaml
name: Add bugs to bugs project

on:
  issues:
    types:
      - opened

jobs:
  add-to-project:
    name: Add issue to project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@main
        with:
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
          labeled: bug
```

## Inputs

- <a name="project-url">`project-url`</a> _(required)_ is the URL of the GitHub Project to add issues to.
- <a name="github-token">`github-token`</a> _(required)_ is a [personal access
  token](https://github.com/settings/tokens/new) with the `repo`, `write:org` and
  `read:org` scopes.
  _See [Creating a PAT and adding it to your repository](creating-a-pat-and-adding-it-to-your-repository) for more details_
- <a name="labeled">`labeled`</a> _(optional)_ is a comma-separated list of labels. For an issue to be added to the
  project, it must have _one_ of the labels in the list. Omitting this key means
  that all issues will be added.

## Supported Events

Currently this action supports the following [issue events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#issues):

- `opened`
- `transferred`

This ensures that all issues in the workflow's repo are added to the [specified project](#project-url). If [labeled input(s)](#labeled) are defined, then issues will only be added if they contain at least _one_ of the labels in the list.

## How to point the action to a specific branch or commit sha

Pointing to a branch name generally isn't the safest way to refer to an action, but this is how you can use this action now before we've begun creating releases.

```yaml
jobs:
  add-to-project:
    name: Add issue to project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@main
        with:
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
```

Another option would be to point to a full [commit SHA](https://docs.github.com/en/get-started/quickstart/github-glossary#commit):

```yaml
jobs:
  add-to-project:
    name: Add issue to project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@<commitSHA>
        with:
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
```

## Creating a PAT and adding it to your repository

- create a new [personal access
  token](https://github.com/settings/tokens/new) with `repo`, `write:org` and
  `read:org` scopes
  _see [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)_

- add the newly created PAT as a repository secret, this secret will be referenced by the [github-token input](#github-token)
  _see [Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository)_

## Development

To get started contributing to this project, clone it and install dependencies.
Note that this action runs in Node.js 16.x, so we recommend using that version
of Node (see "engines" in this action's package.json for details).

```shell
> git clone https://github.com/actions/add-to-project
> cd add-to-project
> npm install
```

Or, use [GitHub Codespaces](https://github.com/features/codespaces).

See the [toolkit
documentation](https://github.com/actions/toolkit/blob/master/README.md#packages)
for the various packages used in building this action.

## Publish to a distribution branch

Actions are run from GitHub repositories, so we check in the packaged action in
the "dist/" directory.

```shell
> npm run build
> git add lib dist
> git commit -a -m "Build and package"
> git push origin releases/v1
```

Now, a release can be created from the branch containing the built action.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
