import path from 'path'
import express from 'express'
import api_item from './api/item.js'
import api_raw from './api/raw.js'
import api_text from './api/text.js'
import api_thumbnail from './api/thumbnail.js'

const __dirname = path.resolve()
const app = express()

process.on('uncaughtException', (e) => {
  console.error('Node.js process error.\n', e)
})

app.use((req, res, next) => {
  res.setTimeout(10 * 1000, () => {
    console.error('Request timeout.')
    return res.status(408).send('Request Timeout.')
  })
  next()
})

app.use(express.static('public'))

app.get('/api/item', (req, res) => {
  console.log(req.url)
  try {
    api_item(req, res)
  } catch (e) {
    res.status(500).send()
    console.error(e)
    // throw e
  }
})

app.get('/api/raw*', (req, res) => {
  console.log(req.url)
  try {
    api_raw(req, res)
  } catch (e) {
    res.status(500).send()
    console.error(e)
    // throw e
  }
})

app.get('/api/text', (req, res) => {
  console.log(req.url)
  try {
    api_text(req, res)
  } catch (e) {
    res.status(500).send()
    console.error(e)
    // throw e
  }
})

app.get('/api/thumbnail', (req, res) => {
  console.log(req.url)
  try {
    api_thumbnail(req, res)
  } catch (e) {
    res.status(500).send()
    console.error(e)
    // throw e
  }
})

app.get('/((?!api)*)', (req, res) => {
  console.log(req.url)
  res.sendFile(`${__dirname}/public/index.html`)
})

console.info('http://localhost:3000')
app.listen(3000)