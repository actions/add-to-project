import * as core from '@actions/core'
import * as github from '@actions/github'
import {addToProject} from '../src/add-to-project'

describe('addToProject', () => {
  let outputs: Record<string, string>

  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  beforeEach(() => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': 'gh_token'
    })

    outputs = mockSetOutput()
  })

  afterEach(() => {
    github.context.payload = {}
    jest.restoreAllMocks()
  })

  test('adds an issue to the project', async () => {
    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectNext: {
              id: 'project-next-id'
            }
          }
        }
      },
      {
        test: /addProjectNextItem/,
        return: {
          addProjectNextItem: {
            projectNextItem: {
              id: 'project-next-item-id'
            }
          }
        }
      }
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-next-item-id')
  })

  test('adds matching issues with a label filter without label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new'
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}]
      }
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectNext: {
              id: 'project-next-id'
            }
          }
        }
      },
      {
        test: /addProjectNextItem/,
        return: {
          addProjectNextItem: {
            projectNextItem: {
              id: 'project-next-item-id'
            }
          }
        }
      }
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-next-item-id')
  })

  test('does not add un-matching issues with a label filter without label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug'
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: []
      }
    }

    const infoSpy = jest.spyOn(core, 'info')
    const gqlMock = mockGraphQL()
    await addToProject()
    expect(infoSpy).toHaveBeenCalledWith(`Skipping issue 1 because it does not have one of the labels: bug`)
    expect(gqlMock).not.toHaveBeenCalled()
  })

  test('adds matching issues with labels filter with AND label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
      'label-operator': 'AND'
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}, {name: 'new'}]
      }
    }

    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectNext: {
              id: 'project-next-id'
            }
          }
        }
      },
      {
        test: /addProjectNextItem/,
        return: {
          addProjectNextItem: {
            projectNextItem: {
              id: 'project-next-item-id'
            }
          }
        }
      }
    )

    await addToProject()

    expect(outputs.itemId).toEqual('project-next-item-id')
  })

  test('does not add un-matching issues with labels filter with AND label-operator', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': 'gh_token',
      labeled: 'bug, new',
      'label-operator': 'AND'
    })

    github.context.payload = {
      issue: {
        number: 1,
        labels: [{name: 'bug'}, {name: 'other'}]
      }
    }

    const infoSpy = jest.spyOn(core, 'info')
    const gqlMock = mockGraphQL()
    await addToProject()
    expect(infoSpy).toHaveBeenCalledWith(`Skipping issue 1 because it doesn't match all the labels: bug, new`)
    expect(gqlMock).not.toHaveBeenCalled()
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
      graphql: mock
    } as unknown as ReturnType<typeof github.getOctokit>
  })

  return mock
}
