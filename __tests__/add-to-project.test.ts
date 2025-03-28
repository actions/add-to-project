import * as core from '@actions/core'
import * as github from '@actions/github'

import {addToProject, mustGetOwnerTypeQuery, withRetries} from '../src/add-to-project'

describe('addToProject', () => {
  let outputs: Record<string, string>

  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  beforeEach(() => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
    })

    outputs = mockSetOutput()
  })

  afterEach(() => {
    github.context.payload = {}
    jest.restoreAllMocks()
  })

  test('adds an issue from the same organization to the project', async () => {
    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-item-id')
  })

  test('adds an issue from a different organization to the project', async () => {
    github.context.payload = {
      issue: {
        number: 2221,
        labels: [{name: 'bug'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/octokit/octokit.js/issues/2221',
      },
      repository: {
        name: 'octokit.js',
        owner: {
          login: 'octokit',
        },
      },
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2DraftIssue/,
        return: {
          addProjectV2DraftIssue: {
            projectItem: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-item-id')
  })

  test('adds matching issues with a label filter without label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-item-id')
  })

  test('adds matching pull-requests with a label filter without label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
    })

    github.context.payload = {
      // eslint-disable-next-line camelcase
      pull_request: {
        number: 1,
        labels: [{name: 'bug'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/pull/136',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-item-id')
  })

  test('does not add un-matching issues with a label filter without label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    const infoSpy = jest.spyOn(core, 'info')
    const gqlMock = mockGraphQL()
    await addToProject()
    expect(infoSpy).toHaveBeenCalledWith(`Skipping issue 1 because it does not have one of the labels: bug`)
    expect(gqlMock).not.toHaveBeenCalled()
  })

  test('adds matching issues with labels filter with AND label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
      'label-operator': 'AND',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}, {name: 'new'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-item-id')
  })

  test('does not add un-matching issues with labels filter with AND label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
      'label-operator': 'AND',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}, {name: 'other'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    const infoSpy = jest.spyOn(core, 'info')
    const gqlMock = mockGraphQL()
    await addToProject()
    expect(infoSpy).toHaveBeenCalledWith(`Skipping issue 1 because it doesn't match all the labels: bug, new`)
    expect(gqlMock).not.toHaveBeenCalled()
  })

  test('does not add matching issues with labels filter with NOT label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
      'label-operator': 'NOT',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    const infoSpy = jest.spyOn(core, 'info')
    const gqlMock = mockGraphQL()
    await addToProject()
    expect(infoSpy).toHaveBeenCalledWith(`Skipping issue 1 because it contains one of the labels: bug, new`)
    expect(gqlMock).not.toHaveBeenCalled()
  })

  test('adds issues that do not have labels present in the label list with NOT label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
      'label-operator': 'NOT',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'other'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-next-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-next-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-next-item-id')
  })

  test('adds matching issues with multiple label filters', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'accessibility,backend,bug',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'accessibility'}, {name: 'backend'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    const gqlMock = mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    const infoSpy = jest.spyOn(core, 'info')

    await addToProject()

    expect(gqlMock).toHaveBeenCalled()
    expect(infoSpy).toHaveBeenCalledWith('Creating project item')
    // We shouldn't have any logs relating to the issue being skipped
    expect(infoSpy.mock.calls.length).toEqual(1)
    expect(outputs.itemId).toEqual('project-item-id')
  })

  test('does not add un-matching issues with multiple label filters', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'accessibility, backend, bug',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'data'}, {name: 'frontend'}, {name: 'improvement'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    const infoSpy = jest.spyOn(core, 'info')
    const gqlMock = mockGraphQL()
    await addToProject()
    expect(infoSpy).toHaveBeenCalledWith(
      `Skipping issue 1 because it does not have one of the labels: accessibility, backend, bug`,
    )
    expect(gqlMock).not.toHaveBeenCalled()
  })

  test('handles spaces and extra commas gracefully in label filter input', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'accessibility  ,   backend    ,,  . ,     bug',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'accessibility'}, {name: 'backend'}, {name: 'bug'}],
        'label-operator': 'AND',
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    const gqlMock = mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    const infoSpy = jest.spyOn(core, 'info')

    await addToProject()

    expect(gqlMock).toHaveBeenCalled()
    expect(infoSpy).toHaveBeenCalledWith('Creating project item')
    // We shouldn't have any logs relating to the issue being skipped
    expect(infoSpy.mock.calls.length).toEqual(1)
    expect(outputs.itemId).toEqual('project-item-id')
  })

  test(`throws an error when url isn't a valid project url`, async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/repositories',
      'github-token': 'gh_token',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    const infoSpy = jest.spyOn(core, 'info')
    const gqlMock = mockGraphQL()
    await expect(addToProject()).rejects.toThrow(
      'Invalid project URL: https://github.com/orgs/github/repositories. Project URL should match the format <GitHub server domain name>/<orgs-or-users>/<ownerName>/projects/<projectNumber>',
    )
    expect(infoSpy).not.toHaveBeenCalled()
    expect(gqlMock).not.toHaveBeenCalled()
  })

  test(`works with URLs that are not under the github.com domain`, async () => {
    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://notgithub.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-item-id')
  })

  test('constructs the correct graphQL query given an organization owner', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    const gqlMock = mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(gqlMock).toHaveBeenNthCalledWith(1, expect.stringContaining('organization(login: $projectOwnerName)'), {
      projectOwnerName: 'actions',
      projectNumber: 1,
    })
  })

  test('constructs the correct graphQL query given a user owner', async () => {
    mockGetInput({
      'project-url': 'https://github.com/users/monalisa/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/monalisa/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'monalisa',
        },
      },
    }

    const gqlMock = mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(gqlMock).toHaveBeenNthCalledWith(1, expect.stringContaining('user(login: $projectOwnerName)'), {
      projectOwnerName: 'monalisa',
      projectNumber: 1,
    })
  })

  test('compares labels case-insensitively', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/actions/projects/1',
      'github-token': 'gh_token',
      labeled: 'FOO, Bar, baz',
      'label-operator': 'AND',
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'foo'}, {name: 'BAR'}, {name: 'baz'}],
        // eslint-disable-next-line camelcase
        html_url: 'https://github.com/actions/add-to-project/issues/74',
      },
      repository: {
        name: 'add-to-project',
        owner: {
          login: 'actions',
        },
      },
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectV2: {
              id: 'project-next-id',
            },
          },
        },
      },
      {
        test: /addProjectV2ItemById/,
        return: {
          addProjectV2ItemById: {
            item: {
              id: 'project-next-item-id',
            },
          },
        },
      },
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-next-item-id')
  })
})

describe('mustGetOwnerTypeQuery', () => {
  test('returns organization for orgs ownerType', async () => {
    const ownerTypeQuery = mustGetOwnerTypeQuery('orgs')

    expect(ownerTypeQuery).toEqual('organization')
  })

  test('returns user for users ownerType', async () => {
    const ownerTypeQuery = mustGetOwnerTypeQuery('users')

    expect(ownerTypeQuery).toEqual('user')
  })

  test('throws an error when an unsupported ownerType is set', async () => {
    expect(() => {
      mustGetOwnerTypeQuery('unknown')
    }).toThrow(`Unsupported ownerType: unknown. Must be one of 'orgs' or 'users'`)
  })
})

describe('withRetries', () => {
  test('should succeed on successful callback', async () => {
    withRetries(0, 0, () => {
      return Promise.resolve('some string')
    }).then(data => {
      expect(data).toBe('some string')
    })
  })

  test('should fail when reaching retry limit', async () => {
    let invocations = 0

    expect(() =>
      withRetries(0, 3, () => {
        invocations = invocations + 1
        throw new Error('some error')
      }),
    ).toThrow('some error')

    expect(invocations).toEqual(4)
  })
})

function mockGetInput(mocks: Record<string, string>): jest.SpyInstance {
  const mock = (key: string) => mocks[key] ?? ''
  return jest.spyOn(core, 'getInput').mockImplementation(mock)
}

function mockSetOutput(): Record<string, string> {
  const output: Record<string, string> = {}
  jest.spyOn(core, 'setOutput').mockImplementation((key, value) => (output[key] = value))
  return output
}

function mockGraphQL(...mocks: {test: RegExp; return: unknown}[]): jest.Mock {
  const mock = jest.fn().mockImplementation((query: string) => {
    const match = mocks.find(m => m.test.test(query))

    if (match) {
      return match.return
    }

    throw new Error(`Unexpected GraphQL query: ${query}`)
  })

  jest.spyOn(github, 'getOctokit').mockImplementation(() => {
    return {
      graphql: mock,
    } as unknown as ReturnType<typeof github.getOctokit>
  })

  return mock
}
