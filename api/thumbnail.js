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

  const data = await getThumbnail(path, access_token)

  if (data.url) {
    res.setHeader('Cache-Control', `max-age=0, s-maxage=${3600 - 10}`)
    res.redirect(301, data.url)
    return
  }

  res.setHeader('Cache-Control', `public, max-age=120, immutable, s-maxage=${300 - 120}, stale-while-revalidate=${3600 * 3}`)
  res.json(data)
}

async function getThumbnail(path, access_token) {
  const requestUrl = `${drive_api}${wrapPath(path, '/thumbnails/0/large')}`
  console.log(requestUrl)
  const res = await fetch(requestUrl, {
    headers: {
      Authorization: `bearer ${access_token}`
    }
  })
  return await res.json()
}