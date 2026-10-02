
    /* ══════════════════════════════════
       AUTH CHECK — session courante ou "Se souvenir de moi"
    ══════════════════════════════════ */
    ;(function() {
      var token = sessionStorage.getItem('nyxia_token') || ''

      function enterWithSession(data) {
        if (!data || !data.valid || !data.token) return false
        sessionStorage.setItem('nyxia_token', data.token)
        var first = String(data.firstname || '').trim()
        if (first) sessionStorage.setItem('nyxia_firstname', first)
        if (first || data.email) {
          try {
            localStorage.setItem('nyxia_user_context', JSON.stringify({
              firstname: first || '',
              email: data.email || ''
            }))
          } catch (_) {}
        }
        window.location.href = '/dashbord'
        return true
      }

      if (token) {
        fetch('/api/check-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token })
        })
        .then(function(r) { return r.json() })
        .then(function(data) {
          if (data.valid) {
            window.location.href = '/dashbord'
            return
          }
          sessionStorage.removeItem('nyxia_token')
          return fetch('/api/resume-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
          }).then(function(r){ return r.ok ? r.json() : null }).then(enterWithSession)
        })
        .catch(function(){})
      } else {
        fetch('/api/resume-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        })
        .then(function(r){ return r.ok ? r.json() : null })
        .then(enterWithSession)
        .catch(function(){})
      }
    })()

    /* ══════════════════════════════════
       LOGIN
    ══════════════════════════════════ */
    function doLogin() {
      var firstname = document.getElementById('firstname').value.trim()
      var email    = document.getElementById('email').value.trim()
      var password = document.getElementById('password').value.trim()
      var remember = !!document.getElementById('remember-me').checked
      var btn      = document.getElementById('btn-login')
      var spinner  = document.getElementById('spinner')
      var btnText  = document.getElementById('btn-text')
      var msgBox   = document.getElementById('msg-box')

      if (!firstname || !email || !password) {
        showMsg('Prénom, courriel et mot de passe requis.', 'error')
        return
      }

      btn.disabled = true
      spinner.style.display = 'block'
      btnText.textContent = 'Connexion...'
      msgBox.style.display = 'none'

      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname: firstname, email: email, password: password, remember: remember })
      })
      .then(function(r) {
        return r.json().then(function(data) {
          data.__status = r.status
          data.__ok = r.ok
          return data
        }).catch(function() {
          return { __status: r.status, __ok: r.ok, error: 'Réponse invalide du serveur.' }
        })
      })
      .then(function(data) {
        if (data.token && data.__ok !== false) {
          sessionStorage.setItem('nyxia_token', data.token)
          var nyxFirstName = String(data.firstname || '').trim()
          if (!nyxFirstName) {
            showMsg('Le prénom est requis pour entrer dans le portail.', 'error')
            sessionStorage.removeItem('nyxia_token')
            btn.disabled = false
            spinner.style.display = 'none'
            btnText.textContent = 'Se connecter'
            return
          }
          sessionStorage.setItem('nyxia_firstname', nyxFirstName)
          try {
            localStorage.setItem('nyxia_user_context', JSON.stringify({ firstname: nyxFirstName, email: email }))
          } catch (_) {}
          localStorage.removeItem('nyxia_username')
          showMsg(remember ? '✓ Connexion réussie — cet appareil sera reconnu.' : '✓ Connexion réussie ! Redirection...', 'success')
          setTimeout(function() { window.location.href = '/dashbord' }, 700)
        } else {
          showMsg(data.error || ('Identifiants incorrects. Code : ' + (data.__status || 'inconnu')), 'error')
          btn.disabled = false
          spinner.style.display = 'none'
          btnText.textContent = 'Se connecter'
        }
      })
      .catch(function() {
        showMsg('Erreur de connexion : impossible de joindre le Worker Cloudflare. Vérifie le déploiement et le domaine.', 'error')
        btn.disabled = false
        spinner.style.display = 'none'
        btnText.textContent = 'Se connecter'
      })
    }

    function showMsg(text, type) {
      var box = document.getElementById('msg-box')
      box.textContent = text
      box.className = 'msg-box ' + type
      box.style.display = 'block'
    }

    function togglePw() {
      var input = document.getElementById('password')
      input.type = input.type === 'password' ? 'text' : 'password'
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doLogin()
    })
