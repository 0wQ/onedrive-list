import fetch from 'node-fetch'
import Gist from './Gist.js'

const {
  gist_token = '',
  gist_id = '',
  gist_filename = 'onedrive-token.json',
  firebase_url = '',
  firebase_token = '',
} = process.env

const gist = new Gist(gist_token, gist_id, gist_filename)

const gistDb = async (token) => {
  if (!token) {
    token = await gist.read()
  } else {
    gist.write(token)
  }
  return token
}

const firebaseDb = async (token) => {
  const url = `${firebase_url}?auth=${firebase_token}`
  if (!token) {
    const data = await (await fetch(url)).json()
    return data
  } else {
    fetch(url, {
      method: 'PUT',
      body: JSON.stringify(token),
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('Token stored to database')
    return token
  }
}

let db
if (firebase_url) {
  console.log('Use firebase database')
  db = firebaseDb
} else {
  console.log('Use gist database')
  db = gistDb
}

export default db