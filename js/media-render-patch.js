;(function () {
  'use strict'

  function safeUrl(raw) {
    var value = String(raw || '').trim()
    if (!value) return ''
    try {
      var u = new URL(value, window.location.href)
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : ''
    } catch (_) {
      return ''
    }
  }

  function cleanMediaUrl(raw) {
    return String(raw || '').split('|')[0].trim()
  }

  function pdfEmbedUrl(raw) {
    var url = safeUrl(raw)
    if (!url) return ''
    try {
      var u = new URL(url)
      var host = u.hostname.toLowerCase().replace(/^www\./, '')
      if (host === 'drive.google.com') {
        var m = u.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/)
        var id = m ? m[1] : (u.searchParams.get('id') || '')
        if (id) return 'https://drive.google.com/file/d/' + id + '/preview'
      }
    } catch (_) {}
    return url
  }

  /* Tolérance universelle : si un ancien Worker renvoie URL|Titre,
     le lecteur reçoit quand même uniquement l'URL réelle. */
  if (typeof window.safeLivingVideoUrl === 'function') {
    var originalSafeLivingVideoUrl = window.safeLivingVideoUrl
    window.safeLivingVideoUrl = function (rawUrl) {
      return originalSafeLivingVideoUrl(cleanMediaUrl(rawUrl))
    }
  }

  /* Conserve la logique existante, mais identifie explicitement les PDF. */
  if (typeof window.extractResourceLinks === 'function') {
    window.extractResourceLinks = function (text) {
      var links = []
      var cleaned = String(text || '')

      cleaned = cleaned.replace(/\[(LINK|PDF)\s*:\s*([^\]|]+)(?:\|([^\]]+))?\]/gi, function (_, kind, url, label) {
        var safe = safeUrl(url)
        if (safe) {
          var isPdf = String(kind || '').toUpperCase() === 'PDF'
          var nice = String(label || '').trim()
          if (!nice) nice = isPdf ? 'Ouvrir le PDF' : 'Ouvrir'
          links.push({ url: safe, label: nice, kind: isPdf ? 'pdf' : 'link' })
        }
        return ''
      })

      cleaned = cleaned.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, function (_, label, url) {
        var safe = safeUrl(url)
        if (safe) {
          var isPdf = /\.pdf(?:$|[?#])/i.test(safe)
          links.push({ url: safe, label: String(label || (isPdf ? 'Ouvrir le PDF' : 'Ouvrir')).trim(), kind: isPdf ? 'pdf' : 'link' })
        }
        return ''
      })

      cleaned = cleaned.replace(/\b(https?:\/\/[^\s<]+\.pdf(?:[?#][^\s<]*)?)\b/gi, function (_, url) {
        var safe = safeUrl(url)
        if (safe) links.push({ url: safe, label: 'Ouvrir le PDF', kind: 'pdf' })
        return ''
      })

      return { text: cleaned.trim(), links: links }
    }
  }

  if (typeof window.appendGlassLink === 'function') {
    var originalAppendGlassLink = window.appendGlassLink

    window.appendGlassLink = function (wrapper, item) {
      if (!item || !item.url) return

      var isPdf = item.kind === 'pdf' || /\.pdf(?:$|[?#])/i.test(item.url)
      if (!isPdf) {
        originalAppendGlassLink(wrapper, item)
        return
      }

      var embed = pdfEmbedUrl(item.url)
      if (!embed) {
        originalAppendGlassLink(wrapper, item)
        return
      }

      var card = document.createElement('div')
      card.className = 'nx-pdf-preview'
      card.style.cssText = [
        'width:min(100%,720px)',
        'margin-top:8px',
        'padding:10px',
        'border-radius:16px',
        'border:1px solid rgba(123,92,255,0.22)',
        'background:linear-gradient(145deg,rgba(123,92,255,0.09),rgba(255,255,255,0.025))',
        'box-shadow:0 12px 30px rgba(20,12,48,0.16)'
      ].join(';')

      var label = document.createElement('div')
      label.textContent = '📄 ' + (item.label || 'Document PDF')
      label.style.cssText = 'font-size:12px;font-weight:700;color:#c4b5fd;letter-spacing:.02em;margin:1px 2px 9px'
      card.appendChild(label)

      var frame = document.createElement('iframe')
      frame.src = embed
      frame.title = item.label || 'Document PDF'
      frame.loading = 'lazy'
      frame.style.cssText = [
        'display:block',
        'width:100%',
        'height:min(68vh,620px)',
        'min-height:420px',
        'border:0',
        'border-radius:11px',
        'background:#fff'
      ].join(';')
      card.appendChild(frame)

      var a = document.createElement('a')
      a.href = item.url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.className = 'nx-glass-link'
      a.style.marginTop = '9px'
      a.innerHTML = '<span class="nx-glass-link-icon">↗</span><span>' +
        String(item.label || 'Ouvrir le PDF') +
        '</span><span class="nx-glass-link-arrow">↗</span>'
      card.appendChild(a)

      wrapper.appendChild(card)
    }
  }
})()
