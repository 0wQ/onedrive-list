const { getAccessToken, getItem } = require('./api')

exports.default = async (req, res) => {

  if (typeof global.count === 'undefined') global.count = 0
  const count = ++global.count

  const {
    path = '',
    raw = '',
    album = '',
  } = req.query

  const isRaw = raw === '1' || raw === 'true'
  const isAlbum = album === '1' || album === 'true'

  console.time(`${count} getAccessToken()`)
  const access_token = await getAccessToken()
  console.timeEnd(`${count} getAccessToken()`)
  if (!access_token) {
    console.error('access_token is empty.')
    return
  }

  console.time(`${count} getItem()`)
  const data = await getItem(path, access_token, isRaw, isAlbum)
  console.timeEnd(`${count} getItem()`)

  res.setHeader('Access-Control-Allow-Origin', '*')

  if (isRaw && data['@microsoft.graph.downloadUrl']) {
    const downloadUrl = data['@microsoft.graph.downloadUrl']
    res.setHeader('Cache-Control', `max-age=0, s-maxage=${3600 - 10}`)
    res.redirect(301, downloadUrl)
    return
  }
  res.setHeader('Cache-Control', `public, max-age=120, immutable, s-maxage=${300 - 120}, stale-while-revalidate=${3600 * 3}`)
  res.json(data)
}
