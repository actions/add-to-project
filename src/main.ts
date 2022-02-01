import * as core from '@actions/core'
import {addToProject} from './add-to-project'

addToProject()
  .catch(err => {
    core.setFailed(err.message)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
