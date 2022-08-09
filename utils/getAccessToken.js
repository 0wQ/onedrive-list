import fetch from 'node-fetch'
import db from '../utils/db.js'

const {
  client_id = '',
  client_secret = '',
  redirect_uri = 'http://localhost:3000',
  auth_endpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0',
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
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
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
export const getAccessToken = async () => {
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