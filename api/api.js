const fetch = require('node-fetch')
const { db } = require('./db')
const { posix: pathPosix } = require('path')

const {
  base_dir = '/',
  top = 500,
  client_id = '',
  client_secret = '',
  redirect_uri = 'http://localhost:3000',
  auth_endpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0',
  drive_api = 'https://graph.microsoft.com/v1.0/me/drive',
} = process.env

const timestamp = () => (Date.now() / 1000) | 0
const checkExpired = (token) => {
  const { expires_at = 0 } = token
  if (timestamp() > expires_at) {
    console.info('Token expired.')
    return true
  }
}

async function acquireAccessToken(refresh_token) {
  if (client_id === '' || client_secret === '') throw new Error('client_id, client_secret is required.')
  const res = await fetch(`${auth_endpoint}/token`, {
    method: 'POST',
    body: `${new URLSearchParams({
      grant_type: 'refresh_token',
      client_id,
      client_secret,
      refresh_token,
    }).toString()}&redirect_uri=${redirect_uri}`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
  const storeToken = async () => {
    const { expires_in, access_token, refresh_token, error, error_description } = await res.json()
    error && console.error(error_description)
    const expires_at = timestamp() + expires_in
    const token = { expires_at, access_token, refresh_token }
    return await db(token)
  }
  return await storeToken()
}

let _token = {}
exports.getAccessToken = async () => {
  if (_token.access_token && !checkExpired(_token)) {
    console.info('Fetch access_token from memory.')
    return _token.access_token
  }
  console.info('Fetch access_token from database.')
  _token = await db()
  if (_token.refresh_token && checkExpired(_token)) {
    console.info('Fetch access_token from MS Graph.')
    _token = await acquireAccessToken(_token.refresh_token)
  }
  if (!_token.refresh_token) {
    console.error('refresh_token is required in database.')
  }
  return _token.access_token || ''
}

exports.getItem = async (path, access_token, isRaw = false, isAlbum = false) => {
  const isFolder = path.endsWith('/') || path === ''
  const basePath = pathPosix.resolve('/', base_dir)
  const wrapPath = (path) => {
    let wrapedPath = pathPosix.join(basePath, pathPosix.resolve('/', path))
    wrapedPath = wrapedPath.replace(/\/$/, '')
    if (wrapedPath === '') {
      return '/root/children'
    }
    return `/root:${encodeURIComponent(wrapedPath)}${isFolder ? ':/children' : ''}`
  }
  const requestUrl = `${drive_api}${wrapPath(path)}?select=${isRaw ? '@microsoft.graph.downloadUrl,' : ''}${isAlbum ? 'image,' : ''}name,size,lastModifiedDateTime,file&top=${top}`
  const res = await fetch(requestUrl, {
    headers: {
      Authorization: `bearer ${access_token}`,
    }
  })
  const data = await res.json()
  delete data['@odata.context']
  delete data['@odata.nextLink']
  if ('value' in data) {
    for (const i of data.value) {
      delete i['@odata.etag']
      if ('file' in i) delete i['file']['hashes']
    }
  } else {
    delete data['@odata.etag']
    if ('file' in data) delete data['file']['hashes']
  }
  return data
}
