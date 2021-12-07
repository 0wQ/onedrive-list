const { Octokit } = require('@octokit/core')

const Gist = class {
  #octokit
  #gist_id
  #gist_filename

  constructor(auth, gist_id, gist_filename) {
    this.#octokit = new Octokit({ auth: auth })
    this.#gist_id = gist_id
    this.#gist_filename = gist_filename
  }

  async read() {
    console.log('fetch data from gist:', this.#gist_filename)
    const response = await this.#octokit.request('GET /gists/{gist_id}', {
      gist_id: this.#gist_id
    })
    return JSON.parse(response.data.files[this.#gist_filename].content)
  }

  async write(data) {
    const data_str = JSON.stringify(data, null, 2)
    console.log('updated:', data_str)
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

const { gist_token, gist_id, gist_filename = 'onedrive-token.json' } = process.env
const gist = new Gist(gist_token, gist_id, gist_filename)
const db = async (token) => {
  if (!token) {
    token = await gist.read()
  } else {
    await gist.write(token)
  }
  return token
}

exports.db = db