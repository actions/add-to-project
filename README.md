# actions/add-to-project

Use this action to automatically add the current issue or pull request to a [GitHub project](https://docs.github.com/en/issues/trying-out-the-new-projects-experience/about-projects).
Note that this action does not support [GitHub projects (classic)](https://docs.github.com/en/issues/organizing-your-work-with-project-boards).

## Current Status

[![build-test](https://github.com/actions/add-to-project/actions/workflows/test.yml/badge.svg)](https://github.com/actions/add-to-project/actions/workflows/test.yml)

> **NOTE:** ⚠️ This action no longer uses the deprecated ProjectNext API. If you are looking for the old version of that action, use version [v0.0.5](https://github.com/actions/add-to-project/releases/tag/v0.0.5).

## Usage

_See [action.yml](action.yml) for [metadata](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions) that defines the inputs, outputs, and runs configuration for this action._

_For more information about workflows, see [Using workflows](https://docs.github.com/en/actions/using-workflows)._

Create a workflow that runs when Issues or Pull Requests are opened or labeled in your repository; this workflow also supports adding Issues to your project which are transferred into your repository. Optionally configure any filters you may want to add, such as only adding issues with certain labels. You may match labels with an `AND` or an `OR` operator, or exclude labels with a `NOT` operator.

Once you've configured your workflow, save it as a `.yml` file in your target Repository's `.github/workflows` directory.

### Examples

#### Example Usage: Issue opened with labels `bug` OR `needs-triage`

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
      - uses: actions/add-to-project@RELEASE_VERSION
        with:
          # You can target a project in a different organization
          # to the issue
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
          labeled: bug, needs-triage
          label-operator: OR
```

#### Example Usage: Adds all issues opened that do not include the label `bug` OR `needs-triage`

```yaml
name: Adds all issues that don't include the 'bug' or 'needs-triage' labels to project board

on:
  issues:
    types:
      - opened

jobs:
  add-to-project:
    name: Add issue to project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@RELEASE_VERSION
        with:
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
          labeled: bug, needs-triage
          label-operator: NOT
```

#### Example Usage: Pull Requests labeled with `needs-review` and `size/XL`

```yaml
name: Add needs-review and size/XL pull requests to projects

on:
  pull_request:
    types:
      - labeled

jobs:
  add-to-project:
    name: Add issue to project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@RELEASE_VERSION
        with:
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
          labeled: needs-review, size/XL
          label-operator: AND
```

### Further reading and additional resources

- [actions/add-to-project](#actionsadd-to-project)
  - [Current Status](#current-status)
  - [Usage](#usage)
    - [Examples](#examples)
      - [Example Usage: Issue opened with labels `bug` OR `needs-triage`](#example-usage-issue-opened-with-labels-bug-or-needs-triage)
      - [Example Usage: Adds all issues opened that do not include the label `bug` OR `needs-triage`](#example-usage-adds-all-issues-opened-that-do-not-include-the-label-bug-or-needs-triage)
      - [Example Usage: Pull Requests labeled with `needs-review` and `size/XL`](#example-usage-pull-requests-labeled-with-needs-review-and-sizexl)
    - [Further reading and additional resources](#further-reading-and-additional-resources)
  - [Inputs](#inputs)
  - [Supported Events](#supported-events)
  - [Creating a PAT and adding it to your repository](#creating-a-pat-and-adding-it-to-your-repository)
  - [Development](#development)
  - [Publish to a distribution branch](#publish-to-a-distribution-branch)
- [License](#license)

## Inputs

- <a name="project-url">`project-url`</a> **(required)** is the URL of the GitHub project to add issues to.
  _eg: `https://github.com/orgs|users/<ownerName>/projects/<projectNumber>`_
- <a name="github-token">`github-token`</a> **(required)** is a [personal access
  token](https://github.com/settings/tokens/new) with `repo` and `project` scopes.
  _See [Creating a PAT and adding it to your repository](#creating-a-pat-and-adding-it-to-your-repository) for more details_
- <a name="labeled">`labeled`</a> **(optional)** is a comma-separated list of labels used to filter applicable issues. When this key is provided, an issue must have _one_ of the labels in the list to be added to the project. Omitting this key means that any issue will be added.
- <a name="labeled">`label-operator`</a> **(optional)** is the behavior of the labels filter, either `AND`, `OR` or `NOT` that controls if the issue should be matched with `all` `labeled` input or any of them, default is `OR`.

## Supported Events

Currently this action supports the following [`issues` events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#issues):

- `opened`
- `reopened`
- `transferred`
- `labeled`

and the following [`pull_request` events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request):

- `opened`
- `reopened`
- `labeled`

Using these events ensure that a given issue or pull request, in the workflow's repo, is added to the [specified project](#project-url). If [labeled input(s)](#labeled) are defined, then issues will only be added if they contain at least _one_ of the labels in the list.

## Creating a PAT and adding it to your repository

- create a new [personal access
  token](https://github.com/settings/tokens/new) with `project` scope. For private repos you will also need `repo` scope.
  _See [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) for more information_

    > **NOTE:** ℹ️ Use a classic token with full control of projects. Personal access tokens with fine grained access do not support the GraphQL API.

- add the newly created PAT as a repository secret, this secret will be referenced by the [github-token input](#github-token)
  _See [Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) for more information_

## Setting a specific status or column name to the project item

If you want to add an issue to a custom default column in a project (i.e. other than 'Todo'), you can do this directly via the project UI. You don't need to add anything else to your YAML workflow file to get this to work.

Use the [Add To GitHub Projects](https://github.com/marketplace/actions/add-to-github-projects) action to assign newly opened issues to the project. And then in the project UI simply [specify which column to use as the default](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/quickstart-for-projects#configure-built-in-automation)!

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
