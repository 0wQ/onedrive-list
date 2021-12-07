const fetch = require('node-fetch')
const { db } = require('./db')

const {
  base_dir = '/Public',
  top = 500,
  client_id = '',
  client_secret = '',
  redirect_uri = 'http://localhost',
  auth_endpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0',
  drive_api = 'https://graph.microsoft.com/v1.0/me/drive',
} = process.env

const timestamp = () => (Date.now() / 1000) | 0

const checkExpired = (token) => {
  const { expires_at } = token
  if (timestamp() > expires_at) {
    console.log('Token expired')
    return true
  }
}

async function acquireAccessToken(refresh_token) {
  console.log('acquireAccessToken()', auth_endpoint)
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
  return await storeToken(res)
}

async function storeToken(res) {
  const { expires_in, access_token, refresh_token, error, error_description } = await res.json()
  error && console.error(error_description)
  const expires_at = timestamp() + expires_in
  const token = { expires_at, access_token, refresh_token }
  return await db(token)
}

let _token
exports.getAccessToken = async () => {
  if (_token && !checkExpired(_token)) {
    console.log('Fetch access_token from memory.')
    return _token.access_token
  }
  _token = await db()
  console.log('Fetch access_token from database.')
  if (!_token || checkExpired(_token)) {
    _token = await acquireAccessToken(_token.refresh_token)
  }
  return _token.access_token
}

exports.getItem = async (path, access_token, isFolder = true, isRaw = false, isAlbum = false) => {
  const wrapPathName = () => {
    const p = base_dir ? base_dir + path : path
    if (isFolder) {
      return p.replace(/\/$/, '')
    }
    return p
  }
  const res = await fetch(
    `${drive_api}/root:${encodeURI(
      wrapPathName()
    ).replace(/#/g, '%23')}${isFolder ? ':/children' : ''}?select=${isRaw ? '@microsoft.graph.downloadUrl,' : ''}name,size,lastModifiedDateTime,file${isAlbum ? ',image' : ''}&top=${top}`,
    {
      headers: {
        Authorization: `bearer ${access_token}`,
      },
    }
  )
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
