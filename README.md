# actions/add-to-project

🚨 **This action is a work in progress. Please do not use it except for
experimentation until a release has been prepared.** 🚨

Use this action to automatically add issues to a GitHub Project. Note that this
is for [GitHub Projects
(beta)](https://docs.github.com/en/issues/trying-out-the-new-projects-experience/about-projects),
not the original GitHub Projects.

To use the action, create a workflow that runs when issues are opened in your
repository. Run this action in a step, optionally configuring any filters you
may want to add, such as only adding issues with certain labels. If you want to match all the labels, add `label-operator` input to be `AND`.

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
      # Pointing to a branch name generally isn't the safest way to refer to an action,
      # but this is how you can use this action now before we've begun creating releases.
      # Another option would be to point to a full commit SHA.
      - uses: actions/add-to-project@main
        with:
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
          labeled: bug, new
          label-operator: AND
```

## Inputs

- `project-url` is the URL of the GitHub Project to add issues to.
- `github-token` is a [personal access
  token](https://github.com/settings/tokens/new) with the `repo`, `write:org` and
  `read:org` scopes.
- `labeled` is a comma-separated list of labels. For an issue to be added to the
  project, it must have _one_ of the labels in the list if the `label-operator` doesn't exist or not `AND`. Omitting this key means
  that all issues will be added.
- `label-operator` is the behavior of the labels filter, either `AND` or `OR` that controls if the issue should be matched with `all` `labeled` input or any of them, default is `OR`.

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
