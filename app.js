require('dotenv').config()
const express = require('express')
const api = require('./api').default

const app = express()

process.on('uncaughtException', (e) => {
  console.error('node.js process error\n', e)
})

app.use((req, res, next) => {
  res.setTimeout(10 * 1000, () => {
    console.log('Request Timeout.')
    return res.status(408).send('Request Timeout.')
  })
  next()
})

app.use(express.static('public'))

app.get('/api', (req, res) => {
  console.log(req.url)
  try {
    api(req, res)
  } catch (e) {
    res.status(500).send()
    console.error(e)
    // throw e
  }
})

console.info('http://localhost:3000')
app.listen(3000)