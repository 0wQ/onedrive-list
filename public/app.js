const CONFIG = {
  theme: '#a685e2',
  preload_enable: true,
  preload_once_max: 15,
  preload_all_max: 100,
  preload_folder_size_min: 1024 * 1024 * 20,
  preload_folder_size_max: 1099511627776,
  fetch_cache: 'default', // default, no-cache, reload, force-cache, only-if-cached
  api: '/api',
}

const prefetches = new Set()
const loadScriptList = new Set()
const loadStyleList = new Set()
const progress = new barOfProgress({ color: CONFIG.theme, delay: 50 }) // https://github.com/badrap/bar-of-progress#customization

let PATH = url2Path(location.href)
let ap = null
let dp = null
let isLoading = false
let zoom = null

setTimeout(breadcrumb, 0)
setTimeout(onPopState, 0)

window.addEventListener('popstate', () => {
  PATH = url2Path(location.href)
  onPopState()
})

document.getElementById('app').addEventListener('click', handler, true)

function handler(e) {
  if (e.target && e.target.nodeName.toLowerCase() == 'a') {
    const href = e.target.getAttribute('href')
    if (href.startsWith('http')) return
    if (e.target.dataset.dl === 'true') return

    e.preventDefault()
    if (window.isLoading) return

    PATH = url2Path(href)
    window.history.pushState(null, '', href)

    document.getElementById('app').classList.add('unclickable')
    const { type, size } = e.target.dataset

    if (type === 'file') {
      preview(e.target.dataset.name, size)
    } else {
      onPopState(0)
    }
  }
}

function preview(name, size) {
  progress.start()
  breadcrumb(PATH)

  const downloadUrl = path2Api(`${PATH}`, raw = true)
  const pushHtml = (s, show_dl_btn = true, show_potplayer_btn = false, p = '1rem 1rem') => {
    document.getElementById('list').innerHTML = `<div style="padding: ${p};">${s}</div>`
    let btn_container = ''
    if (show_dl_btn) {
      btn_container += `<a class="button" data-dl="true" href="${downloadUrl}"><i class="far fa-arrow-alt-circle-down"></i> DOWNLOAD</a>`
    }
    if (show_potplayer_btn && isWindows()) {
      btn_container += `<a class="button" style="margin-left: 1rem;" data-dl="true" onclick="dp.pause();" href="potplayer://${new URL(downloadUrl, location.href).toString()}"><i class="fas fa-external-link-alt"></i> Open With Potplayer</a>`
    }
    document.getElementById('btn').innerHTML = btn_container
  }
  const extension = getExtension(name)
  const fileType = getFileType(extension)
  switch (fileType) {
    case 'image':
      const loadImage = () => pushHtml(`<div class="image-wrapper"><img data-zoomable onload="progress.finish()" onerror="progress.finish()" alt="${name}" style="width: 100%; height: auto; position: relative;" src="${downloadUrl}"></div>`)
      loadImage()
      loadScript('https://unpkg.zhimg.com/medium-zoom@1.0.6/dist/medium-zoom.min.js', () => {
        zoom = mediumZoom('[data-zoomable]')
      })
      break
    case 'video':
      pushHtml(`<div id="dplayer"></div>`, true, true)
      const loadDplayer = () => {
        loadScript('https://unpkg.zhimg.com/dplayer@1.26.0/dist/DPlayer.min.js', () => {
          const container = document.getElementById('dplayer')
          dp = new DPlayer({
            container: container,
            theme: CONFIG.theme,
            screenshot: true,
            // preload: 'none',
            playbackSpeed: [0.2, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 5, 10],
            video: {
              url: downloadUrl,
              type: extension == 'flv' ? 'flv' : 'auto',
            }
          })
          if (extension == 'flv' || extension == 'avi') {
            dp.notice(`\`.${extension}\` video maybe not support.`)
          }
          progress.finish()
        })
      }
      if (extension == 'flv') {
        loadScript('https://unpkg.zhimg.com/flv.js@1.5.0/dist/flv.min.js', () => {
          loadDplayer()
        })
      } else {
        loadDplayer()
      }
      break
    case 'audio':
      pushHtml(`<div id="aplayer" class="aplayer"></div>`, true, false, '.5rem .5rem')
      const loadAplayer = () => {
        loadScript('https://unpkg.zhimg.com/aplayer@1.10.1/dist/APlayer.min.js', async () => {
          const r = await fetch(`https://api.iwz.me/meting/api.php?server=netease&type=search&id=${name.replace(/\.[^/.]+$/, '')}`)
          const search = await r.json()
          let pic = ''
          let lrc = ''
          for (const i of search) {
            const { title = '', author = '' } = i
            const title_match = new RegExp(title.replace(/[^0-9a-zA-Z一-鿋ぁ-ヶ가-힝]+/gi, '').slice(0, 2), 'gi').test(name.replace(/[^0-9a-zA-Z一-鿋ぁ-ヶ가-힝]+/gi, ''))
            const author_match = new RegExp(author.replace(/[^0-9a-zA-Z一-鿋ぁ-ヶ가-힝]+/gi, '').slice(0, 2), 'gi').test(name.replace(/[^0-9a-zA-Z一-鿋ぁ-ヶ가-힝]+/gi, ''))
            if (pic == '' && author_match) pic = i.pic
            if (title_match && author_match) {
              console.log(name, '->', title, '|', author)
              pic = i.pic
              lrc = i.lrc
              break
            }
          }
          ap = new APlayer({
            container: document.getElementById('aplayer'),
            lrcType: lrc ? 3 : 0,
            audio: [{
              name: name.replace(/\.[^/.]+$/, ''),
              url: downloadUrl,
              cover: pic || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
              lrc: lrc,
            }],
            theme: CONFIG.theme,
            loop: 'none',
            // preload: 'none',
          })
          progress.finish()
        })
      }
      loadStyle('https://unpkg.zhimg.com/aplayer@1.10.1/dist/APlayer.min.css', () => loadAplayer())
      break
    case 'pdf':
      // https://mozilla.github.io/pdf.js/web/viewer.html
      // https://mozilla.github.io/pdf.js/legacy/web/viewer.html
      pushHtml(`
        <code>File Name: ${name}</code><br>
        <code>File Size: ${formatSize(size)}</code><br>
        <code>File Path: ${PATH}</code><br>
        <code>File Link: ${new URL(downloadUrl, location.href).toString()}</code><br>
        <p><a target="_blank" href="https://mozilla.github.io/pdf.js/legacy/web/viewer.html?${new URLSearchParams({ file: new URL(downloadUrl, location.href).toString() }).toString()}">Preview Online (PDF.js)</a></p>
        <p><a target="_blank" href="https://docs.google.com/viewer?${new URLSearchParams({ url: new URL(downloadUrl + '&t=' + new Date().getTime(), location.href).toString() }).toString()}">Preview Online (Google Docs)</a></p>
        `, true)
      progress.finish()
      break
    case 'word':
    case 'excel':
    case 'powerpoint':
      pushHtml(`
        <code>File Name: ${name}</code><br>
        <code>File Size: ${formatSize(size)}</code><br>
        <code>File Path: ${PATH}</code><br>
        <code>File Link: ${new URL(downloadUrl, location.href).toString()}</code><br>
        <p><a target="_blank" href="https://view.officeapps.live.com/op/view.aspx?${new URLSearchParams({ src: new URL(downloadUrl + '&t=' + new Date().getTime(), location.href).toString() }).toString()}">Preview Online (Microsoft Office)</a></p>
        <p><a target="_blank" href="https://docs.google.com/viewer?${new URLSearchParams({ url: new URL(downloadUrl + '&t=' + new Date().getTime(), location.href).toString() }).toString()}">Preview Online (Google Docs)</a></p>
        `, true)
      progress.finish()
      break
    case 'code':
    case 'text':
      pushHtml(`
        <code>File Name: ${name}</code><br>
        <code>File Size: ${formatSize(size)}</code><br>
        <code>File Path: ${PATH}</code><br>
        <code>File Link: ${new URL(downloadUrl, location.href).toString()}</code><br>`
        + extension === 'txt'
        ? `<p><a target="_blank" href="https://docs.google.com/viewer?${new URLSearchParams({ url: new URL(downloadUrl + '&t=' + new Date().getTime(), location.href).toString() }).toString()}">Preview Online (Google Docs)</a></p>`
        : `<p>Sorry, we don't support previewing <code>${/\./.test(name) ? '.' + extension : name}</code> files as of today. You can <a data-dl="true" href="${downloadUrl}">download</a> the file directly.</p></div>`
        , true)
      progress.finish()
      break
    default:
      pushHtml(`
        <code>File Name: ${name}</code><br>
        <code>File Size: ${formatSize(size)}</code><br>
        <code>File Path: ${PATH}</code><br>
        <code>File Link: ${new URL(downloadUrl, location.href).toString()}</code><br>
        <p>Sorry, we don't support previewing <code>${/\./.test(name) ? '.' + extension : name}</code> files as of today. You can <a data-dl="true" href="${downloadUrl}">download</a> the file directly.</p></div>`
        , true)
      progress.finish()
  }
  document.getElementById('app').classList.remove('unclickable')
}

function onPopState(delay = 0) {
  window.isLoading = true
  console.time('Loading')
  document.getElementById('btn').innerHTML = ''
  try {
    ap && ap.destroy()
    dp && dp.destroy()
    document.body.classList.remove('dplayer-web-fullscreen-fix')
    zoom && zoom.close()
  } catch (e) {
    console.error(e)
  }

  progress.start()

  if (!prefetches.has(PATH)) {
    prefetches.add(PATH)
  }

  fetch(path2Api(PATH), {
    method: 'GET',
    cache: CONFIG.fetch_cache,
  })
    .then(r => {
      if (r.ok) {
        return r.json()
      } else {
        throw `API: ${r.status}, ${r.statusText}`
      }
    })
    .then(d => setTimeout(() => {
      breadcrumb(PATH)

      // console.log(d)
      if ('value' in d) {
        folderView(d)
      } else if ('file' in d) {
        preview(d.name, d.size)
      } else if ('error' in d) {
        const error = d.error
        switch (error.code) {
          case 'itemNotFound':
            folderView({ value: [] })
          default:
            alert(error.code)
        }
      }
      window.isLoading = false
      console.timeEnd('Loading')
      document.getElementById('app').classList.remove('unclickable')
      progress.finish()
      document.getElementById('list').classList.remove('hide')
    }, delay))
    .catch(e => setTimeout(() => {
      window.isLoading = false
      console.timeEnd('Loading')
      document.getElementById('app').classList.remove('unclickable')
      console.error(e)
      progress.finish()
      alert(e)
    }, delay))
}
function folderView(data) {
  const isIndex = PATH == '/'
  const parentPath = isIndex ? '/' : `${PATH.replace(/\/$/, '').split('/').slice(0, -1).join('/')}/`
  const parentUrl = path2Url(parentPath)

  let list = `<div class="item" ${isIndex ? 'style="display: none;"' : ''}><i class="far fa-folder"></i>..<a href="${parentUrl}">...</a></div>`

  console.log('folder size:', data.value.length)
  const urlList = []
  for (item of data.value) {
    const isFile = 'file' in item
    const { name, size, lastModifiedDateTime } = item
    const url = path2Url(`${PATH}${name}${isFile ? '' : '/'}`)
    list += `<div class="item">
      <i class="${getIconClass(name, isFile)}"></i>${name}<div style="flex-grow: 1"></div>
      <span class="size">${formatSize(size)}</span>
      <a href="${url}" data-name="${name}" data-size="${size}" data-type="${isFile ? 'file' : 'folder'}" title="Last Modified: ${lastModifiedDateTime}">${name}</a>
    </div>`

    !isFile && size >= CONFIG.preload_folder_size_min && size <= CONFIG.preload_folder_size_max && urlList.push(url)
  }

  const html = `<div style="min-width: 280px;">${list}</div>`
  document.getElementById('list').innerHTML = html

  urlList.splice(CONFIG.preload_once_max)

  setTimeout(() => urlList.forEach((u) => {
    requestIdleCallback(() => preload(url2Path(u)), {
      timeout: 2000,
    })
  }))
}
function path2Api(path = '/', raw = false) {
  raw = raw ? '1' : '0'
  return `${CONFIG.api}?${new URLSearchParams({ path, raw }).toString()}`
}
function url2Path(url) {
  const params = new URL(url || '/', location.href).searchParams
  return params.get('path') || '/'
}
function path2Url(p = '/') {
  const params = {}
  if (p != '/') params.path = p
  const params_str = new URLSearchParams(params).toString()
  const search = params_str ? `?${params_str}` : ''
  const url = `${location.pathname}${search}`
  return url
}
function preload(p) {
  if (!CONFIG.preload_enable) return
  if (prefetches.has(p)) return
  if (p === PATH) return

  const size = prefetches.size
  if (size > CONFIG.preload_all_max) return

  console.log(`${size} preload(): ${p}`)

  const url = path2Api(p)
  const prefetcher = document.createElement('link')
  prefetcher.rel = 'prefetch'
  prefetcher.href = url
  document.head.appendChild(prefetcher)

  prefetches.add(p)
}
function formatSize(s = 0) {
  return s < 1024
    ? s + ' B'
    : s < Math.pow(1024, 2)
      ? parseFloat(s / Math.pow(1024, 1)).toFixed(1) + ' KiB'
      : s < Math.pow(1024, 3)
        ? parseFloat(s / Math.pow(1024, 2)).toFixed(1) + ' MiB'
        : s < Math.pow(1024, 4)
          ? parseFloat(s / Math.pow(1024, 3)).toFixed(1) + ' GiB'
          : s < Math.pow(1024, 5)
            ? parseFloat(s / Math.pow(1024, 4)).toFixed(1) + ' TiB'
            : '> 1PiB'
}
function breadcrumb(p = '/') {
  p = p.replace(/\/$/, '')
  const t = p.split('/')
  const len = t.length
  const a = []

  for (let i = 0; i < len; i++) {
    const p2 = `${t.join('/')}/`
    const name = t.pop() || '🚩 Home'
    const url = path2Url(p2)
    a.push(i == 0 ? name : `<a href="${url}">${name}</a>`)
    i == 0 || preload(p2)
  }

  a.reverse()

  document.getElementById('breadcrumb').innerHTML = a.join(' / ')
  document.getElementById('breadcrumb').classList.remove('hide')
}
function loadScript(url, callback, crossorigin = true, async = true) {
  if (loadScriptList.has(url)) {
    if (callback) setTimeout(callback, 0)
    return
  }
  loadScriptList.add(url)
  window.requestAnimationFrame(() => {
    const script = document.createElement('script')
    script.src = url
    script.type = 'text/javascript'
    script.async = async
    if (crossorigin) script.crossOrigin = 'anonymous'
    if (callback) script.onload = callback
    document.head.appendChild(script)
  })
}
function loadStyle(url, callback, crossorigin = true) {
  if (loadStyleList.has(url)) {
    if (callback) setTimeout(callback(), 0)
    return
  }
  loadStyleList.add(url)
  window.requestAnimationFrame(() => {
    const link = document.createElement('link')
    link.href = url
    link.rel = 'stylesheet'
    if (crossorigin) link.crossOrigin = 'anonymous'
    if (callback) link.onload = callback
    document.head.appendChild(link)
  })
}
function getFileType(extension) {
  if (['mp4', 'mkv', 'flv', 'webm', 'avi', 'mov', 'wmv'].includes(extension)) {
    return 'video'
  }
  if (['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp', 'jfif', 'ico', 'bmp', 'avif'].includes(extension)) {
    return 'image'
  }
  if (['flac', 'mp3', 'wav'].includes(extension)) {
    return 'audio'
  }
  if (['7z', 'rar', 'bz2', 'xz', 'tar', 'tgz', 'gz', 'zip', 'iso', 'apk', 'ipa', 'exe', 'msi', 'bin'].includes(extension)) {
    return 'archive'
  }
  if (['js', 'sh', 'php', 'py', 'css', 'html', 'xml', 'ts', 'json', 'yaml', 'toml', 'ini', 'conf', 'bat'].includes(extension)) {
    return 'code'
  }
  if (['txt', 'csv', 'log', 'srt', 'ass', 'ssa'].includes(extension)) {
    return 'text'
  }
  if (['md', 'markdown'].includes(extension)) {
    return 'md'
  }
  if (['pdf'].includes(extension)) {
    return 'pdf'
  }
  if (['ppt', 'pptx'].includes(extension)) {
    return 'powerpoint'
  }
  if (['doc', 'docx'].includes(extension)) {
    return 'word'
  }
  if (['xls', 'xlsx'].includes(extension)) {
    return 'excel'
  }
  return ''
}
function getExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}
function getIconClass(name, isFile) {
  if (isFile) {
    const extension = name.split('.').pop().toLowerCase()
    const fileType = getFileType(extension)
    switch (fileType) {
      case 'video':
        return 'far fa-file-video'
      case 'image':
        return 'far fa-file-image'
      case 'audio':
        return 'far fa-file-audio'
      case 'archive':
        return 'far fa-file-archive'
      case 'code':
        return 'far fa-file-code'
      case 'text':
        return 'far fa-file-alt'
      case 'md':
        return 'fab fa-markdown'
      case 'pdf':
        return 'far fa-file-pdf'
      case 'powerpoint':
        return 'far fa-file-powerpoint'
      case 'word':
        return 'far fa-file-word'
      case 'excel':
        return 'far fa-file-excel'
      default:
        return `far fa-file`
    }
  } else {
    return 'far fa-folder'
  }
}
function isWindows() {
  return navigator.platform.indexOf('Win') > -1
}
