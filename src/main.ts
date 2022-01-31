/* eslint-disable github/no-then */

import * as core from '@actions/core'
import * as github from '@actions/github'

// TODO: Ensure this (and the Octokit client) works for non-github.com URLs, as well.
// https://github.com/orgs/<orgName>/projects/<projectNumber>
const urlParse =
  /^(?:https:\/\/)?github\.com\/orgs\/(?<orgName>[^/]+)\/projects\/(?<projectNumber>\d+)/

interface ProjectNodeIDResponse {
  organization: {
    projectNext: {
      id: string
    }
  }
}

interface ProjectAddItemResponse {
  addProjectNextItem: {
    projectNextItem: {
      id: string
    }
  }
}

async function run(): Promise<void> {
  const projectUrl = core.getInput('project-url', {required: true})
  const ghToken = core.getInput('github-token', {required: true})
  const octokit = github.getOctokit(ghToken)
  const urlMatch = projectUrl.match(urlParse)

  core.debug(`Project URL: ${projectUrl}`)

  if (!urlMatch) {
    throw new Error(
      `Invalid project URL: ${projectUrl}. Project URL should match the format https://github.com/orgs/<orgName>/projects/<projectNumber>`
    )
  }

  const orgName = urlMatch.groups?.orgName
  const projectNumber = parseInt(urlMatch.groups?.projectNumber ?? '', 10)

  core.debug(`Org name: ${orgName}`)
  core.debug(`Project number: ${projectNumber}`)

  // First, use the GraphQL API to request the project's node ID.
  const idResp = await octokit.graphql<ProjectNodeIDResponse>(
    `query getProject($orgName: String!, $projectNumber: Int!) { 
      organization(login: $orgName) {
        projectNext(number: $projectNumber) {
          id
        }
      }
    }`,
    {
      orgName,
      projectNumber
    }
  )

  const projectId = idResp.organization.projectNext.id
  const contentId =
    github.context.payload.issue?.node_id ??
    github.context.payload.pull_request?.node_id

  core.debug(`Project node ID: ${projectId}`)
  core.debug(`Content ID: ${contentId}`)

  // Next, use the GraphQL API to add the issue to the project.
  const addResp = await octokit.graphql<ProjectAddItemResponse>(
    `mutation addIssueToProject($input: AddProjectNextItemInput!) {
      addProjectNextItem(input: $input) {
        projectNextItem {
          id
        }
      }
    }`,
    {
      input: {
        contentId,
        projectId
      }
    }
  )

  core.setOutput('itemId', addResp.addProjectNextItem.projectNextItem.id)
}

run()
  .catch(err => {
    core.setFailed(err.message)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
