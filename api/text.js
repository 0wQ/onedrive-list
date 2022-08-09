import fetch from 'node-fetch'
import { getAccessToken } from '../utils/getAccessToken.js'
import { wrapPath } from '../utils/pathHandler.js'

const {
  drive_api = 'https://graph.microsoft.com/v1.0/me/drive',
} = process.env

export default async (req, res) => {
  const { path = '' } = req.query

  const access_token = await getAccessToken()
  if (!access_token) {
    console.error('access_token is empty.')
    return
  }

  const readme_content = await getContent(`${path}`, access_token)

  res.setHeader('Cache-Control', `public, max-age=120, immutable, s-maxage=${300 - 120}, stale-while-revalidate=${3600 * 3}`)
  res.send(readme_content)
}

async function getContent(path, access_token) {
  const requestUrl = `${drive_api}${wrapPath(path, '/content')}`
  console.log(requestUrl)
  const res = await fetch(requestUrl, {
    headers: {
      Authorization: `bearer ${access_token}`
    }
  })
  return res.status === 200 ? await res.text() : ''
}