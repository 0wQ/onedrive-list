import { Octokit } from '@octokit/core'

export default class {
  #octokit
  #gist_id
  #gist_filename

  constructor(gist_token, gist_id, gist_filename) {
    if (!gist_token || !gist_id || !gist_filename) {
      throw new Error('gist_token, gist_id, gist_filename are required.')
    }
    this.#octokit = new Octokit({ auth: gist_token })
    this.#gist_id = gist_id
    this.#gist_filename = gist_filename
  }

  async read() {
    console.log('Fetch data from gist:', this.#gist_filename)
    const response = await this.#octokit.request('GET /gists/{gist_id}', {
      gist_id: this.#gist_id
    })
    return JSON.parse(response.data.files[this.#gist_filename].content)
  }

  async write(data) {
    const data_str = JSON.stringify(data, null, 2)
    console.log('Update gist:', this.#gist_filename)
    const response = await this.#octokit.request('PATCH /gists/{gist_id}', {
      gist_id: this.#gist_id,
      files: {
        [this.#gist_filename]: {
          content: data_str
        }
      }
    })
    // return JSON.parse(response.data.files[this.#gist_filename].content)
  }
}