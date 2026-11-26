/* SentinelOps AI - dummy UI layer.
   Makes the static pages behave like the real app without a server:
   demo login + roles, form handling, client-side event search/paging, offline copilot. */
(function () {
  'use strict';
  var depth = +(document.querySelector('meta[name="demo-depth"]') || {}).content || 0;
  var pre = new Array(depth + 1).join('../');
  var file = (location.pathname.split('/').pop() || 'login.html').replace(/\.html$/, '') || 'login';
  var inEvents = /\/events\/[^/]+$/.test(location.pathname);
  var PUBLIC = ['login', 'signup', 'forgot_password', 'verify_otp', 'verify_signup', 'verify_reset', 'reset_password'];
  var ACCOUNTS = {
    admin:   { pw: 'Admin@123',   role: 'Administrator' },
    analyst: { pw: 'Analyst@123', role: 'Analyst' },
    manager: { pw: 'Manager@123', role: 'Incident Manager' }
  };
  var ALL = ['dashboard', 'events', 'alerts', 'incidents', 'copilot', 'reports', 'assets', 'users', 'audit'];
  var ACCESS = {
    'Administrator': ALL,
    'Analyst': ['dashboard', 'events', 'alerts', 'incidents', 'copilot', 'reports', 'assets'],
    'Incident Manager': ['dashboard', 'alerts', 'incidents', 'copilot', 'assets', 'audit']
  };
  var S = window.sessionStorage;
  function user() { try { return JSON.parse(S.getItem('so_user')); } catch (e) { return null; } }
  function go(p) { location.href = pre + p; }
  function pageKey() {
    if (inEvents || file === 'event_new') return 'events';
    if (file.indexOf('reports') === 0) return 'reports';
    return file;
  }

  /* ---------- toast ---------- */
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;right:18px;top:18px;z-index:99999;max-width:340px;padding:12px 16px;border-radius:10px;' +
      'font:600 13px/1.4 system-ui,sans-serif;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25);background:' +
      (kind === 'error' ? '#b42318' : kind === 'ok' ? '#157f4b' : '#1f3a8a');
    document.body.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; }, 3200);
    setTimeout(function () { t.remove(); }, 3700);
  }
  function flashNext(msg, kind) { S.setItem('so_flash', JSON.stringify([msg, kind || 'info'])); }
  window.addEventListener('DOMContentLoaded', function () {
    var f = S.getItem('so_flash');
    if (f) { S.removeItem('so_flash'); f = JSON.parse(f); toast(f[0], f[1]); }
  });

  /* ---------- session guard ---------- */
  if (file === 'login' && /logout=1/.test(location.search)) { S.removeItem('so_user'); }
  var u = user();
  var isPublic = PUBLIC.indexOf(file) > -1;
  if (!isPublic && file !== '404' && !u) { document.documentElement.style.visibility = 'hidden'; go('login.html'); return; }
  if (u && !isPublic && file !== '403' && file !== '404' && ACCESS[u.role].indexOf(pageKey()) < 0) { go('403.html'); return; }

  /* ---------- identity + role-based menu ---------- */
  function paintIdentity() {
    if (!u) return;
    document.querySelectorAll('[data-user-name]').forEach(function (n) { n.textContent = u.name; });
    document.querySelectorAll('[data-user-role]').forEach(function (n) { n.textContent = u.role; });
    document.querySelectorAll('[data-user-initial]').forEach(function (n) { n.textContent = u.name.charAt(0).toUpperCase(); });
    var allowed = ACCESS[u.role];
    document.querySelectorAll('a.side-link').forEach(function (a) {
      var k = (a.getAttribute('href') || '').split('/').pop().replace('.html', '');
      if (ALL.indexOf(k) > -1 && allowed.indexOf(k) < 0) a.style.display = 'none';
    });
    if (u.role !== 'Administrator') {   /* admin-only buttons */
      document.querySelectorAll('form[method="post"]').forEach(function (f) {
        if (/Retrain|Regenerate/i.test(f.textContent)) f.style.display = 'none';
      });
    }
  }

  /* ---------- demo ribbon ---------- */
  function ribbon() {
    var r = document.createElement('div');
    r.innerHTML = 'DEMO UI &middot; sample data, no backend';
    r.style.cssText = 'position:fixed;right:14px;bottom:12px;z-index:9999;background:#0f172a;color:#cbd5e1;font:600 11px system-ui,sans-serif;' +
      'padding:6px 12px;border-radius:999px;opacity:.88;letter-spacing:.03em;pointer-events:none';
    document.body.appendChild(r);
  }

  /* ---------- auth flows ---------- */
  function onLogin(form) {
    var name = (form.username.value || '').trim().toLowerCase();
    var acc = ACCOUNTS[name];
    if (!acc || acc.pw !== form.password.value) { toast('Invalid username or password. Use a demo account button below.', 'error'); return; }
    S.setItem('so_user', JSON.stringify({ name: name, role: acc.role }));
    flashNext('Signed in as ' + acc.role + ' (demo - email code skipped).', 'ok');
    go('dashboard.html');
  }
  function formHandler(form) {
    if (file === 'login' && form.querySelector('#username')) return onLogin(form), true;
    if (file === 'signup') { flashNext('Demo: account not created. Enter any 6-digit code.', 'info'); go('verify_signup.html'); return true; }
    if (file === 'forgot_password') { flashNext('Demo: any 6-digit code works.', 'info'); go('verify_reset.html'); return true; }
    if (form.classList.contains('resend')) { toast('Demo: a new code would be emailed here.', 'info'); return true; }
    if (file.indexOf('verify_') === 0 || file === 'verify_otp') {
      var code = (form.code && form.code.value || '').trim();
      if (!/^\d{6}$/.test(code)) { toast('Enter any 6-digit code.', 'error'); return true; }
      if (file === 'verify_signup') { flashNext('Account verified (demo). Please sign in.', 'ok'); go('login.html'); }
      else if (file === 'verify_reset') go('reset_password.html');
      else { S.setItem('so_user', JSON.stringify({ name: 'admin', role: 'Administrator' })); go('dashboard.html'); }
      return true;
    }
    if (file === 'reset_password') { flashNext('Password changed (demo). Please sign in.', 'ok'); go('login.html'); return true; }
    return false;
  }
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (e.defaultPrevented) return;                    /* inline confirm() said no */
    var method = (form.getAttribute('method') || 'get').toLowerCase();
    if (method === 'get' && file.indexOf('reports') === 0 && form.querySelector('[name="pattern"]')) {
      e.preventDefault();
      var p = form.pattern.value, m = form.model ? form.model.value : '';
      var slug = m.toLowerCase().replace(/[^a-z0-9]+/g, '');
      go(p === 'overall' && !m ? 'reports.html' : 'reports_' + p + (slug ? '_' + slug : '') + '.html');
      return;
    }
    if (method === 'get' && file === 'events') { e.preventDefault(); applyEventFilter(); return; }
    if (method !== 'post') return;
    e.preventDefault();
    if (formHandler(form)) return;
    var btn = form.querySelector('button[type="submit"],button:not([type])');
    var label = btn ? btn.textContent.trim() : 'This action';
    toast('Demo mode: "' + label + '" is not saved - there is no server behind this page.', 'info');
  });

  /* ---------- events: client-side search / label / paging ---------- */
  var PER = 25, page = 1, rows = [];
  function applyEventFilter() { page = 1; renderEvents(); }
  function renderEvents() {
    var q = ((document.querySelector('input[name="q"]') || {}).value || '').trim().toLowerCase();
    var lab = (document.querySelector('select[name="label"]') || {}).value || '';
    var hit = rows.filter(function (r) {
      var c = r.cells;
      var txt = (c[0].textContent + ' ' + c[2].textContent + ' ' + c[3].textContent).toLowerCase();
      return (!q || txt.indexOf(q) > -1) && (!lab || c[6].textContent.trim() === lab);
    });
    var pages = Math.max(1, Math.ceil(hit.length / PER));
    page = Math.min(page, pages);
    rows.forEach(function (r) { r.style.display = 'none'; });
    hit.slice((page - 1) * PER, page * PER).forEach(function (r) { r.style.display = ''; });
    var foot = document.getElementById('evFoot');
    foot.innerHTML = '<span>Page ' + page + ' of ' + pages + ' &middot; ' + hit.length + ' events</span><div></div>';
    var box = foot.querySelector('div');
    [['Previous', page > 1, -1], ['Next', page < pages, 1]].forEach(function (b) {
      if (!b[1]) return;
      var a = document.createElement('a');
      a.className = 'btn btn-sm btn-outline-secondary ms-1'; a.href = '#'; a.textContent = b[0];
      a.onclick = function (ev) { ev.preventDefault(); page += b[2]; renderEvents(); window.scrollTo(0, 0); };
      box.appendChild(a);
    });
  }
  function initEvents() {
    var tbody = document.querySelector('table tbody');
    if (!tbody) return;
    rows = Array.prototype.slice.call(tbody.rows);
    var foot = tbody.closest('table').nextElementSibling;
    foot.id = 'evFoot';
    var params = new URLSearchParams(location.search);
    if (params.get('q')) document.querySelector('input[name="q"]').value = params.get('q');
    renderEvents();
  }

  /* ---------- copilot (offline answers captured from the real app) ---------- */
  var answers = null;
  function loadAnswers() {
    return answers ? Promise.resolve(answers) : fetch(pre + 'static/data/copilot_answers.json').then(function (r) { return r.json(); }).then(function (a) { return (answers = a); });
  }
  var realFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    if (/api\/copilot$/.test(String(url))) {
      var msg = ''; try { msg = JSON.parse(opts.body).message || ''; } catch (e) {}
      var m = msg.toLowerCase();
      var key = /brute|password|login|auth/.test(m) ? 'Show me a brute force event'
        : /port|scan/.test(m) ? 'Investigate port scanning'
        : /transfer|exfil|data|bytes/.test(m) ? 'Explain unusual data transfer'
        : /privilege|admin|escalat/.test(m) ? 'Show me a privilege escalation event'
        : /malware|process/.test(m) ? 'Show me a malware event'
        : /critical|alert/.test(m) ? 'Show critical alerts'
        : /malicious|suspicious|find|activity/.test(m) ? 'Find malicious activity' : 'What can you do?';
      return loadAnswers().then(function (a) {
        var body = a[key] || { reply: 'Demo copilot: try one of the suggested prompts.' };
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });
    }
    return realFetch(url, opts);
  };

  /* ---------- init ---------- */
  window.addEventListener('DOMContentLoaded', function () {
    document.documentElement.style.visibility = '';
    paintIdentity();
    ribbon();
    if (file === 'events') initEvents();
  });
})();
