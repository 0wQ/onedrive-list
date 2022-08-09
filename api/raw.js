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

  const data = await getRaw(path, access_token)

  if (data['@microsoft.graph.downloadUrl']) {
    const downloadUrl = data['@microsoft.graph.downloadUrl']
    res.setHeader('Cache-Control', `max-age=0, s-maxage=${3600 - 10}`)
    res.redirect(301, downloadUrl)
    return
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', `public, max-age=120, immutable, s-maxage=${300 - 120}, stale-while-revalidate=${3600 * 3}`)
  res.json(data)
}

async function getRaw(path, access_token) {
  // const requestUrl = `${drive_api}${wrapPath(path, '/children')}?select=@microsoft.graph.downloadUrl,name,size,lastModifiedDateTime,file&$top=${top}`
  const requestUrl = `${drive_api}${wrapPath(path, '/children')}?select=@microsoft.graph.downloadUrl`
  console.log(requestUrl)
  const res = await fetch(requestUrl, {
    headers: {
      Authorization: `bearer ${access_token}`
    }
  })
  return await res.json()
}