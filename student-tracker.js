<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>

<script>
/* ========= CONFIG (DO NOT MODIFY PAGE CODE) ========= */
window.STUDENT_TRACKER_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBK5UM0n8-GLvleW7l6B8Hi-_WuC64QA4U",
    authDomain: "scores-b25a7.firebaseapp.com",
    databaseURL: "https://scores-b25a7-default-rtdb.firebaseio.com",
    projectId: "scores-b25a7"
  },
  /* You control where studentId comes from */
  getStudentId: () =>
    localStorage.getItem('studentId') ||
    sessionStorage.getItem('studentId') ||
    'unknown'
};
/* =================================================== */

(function () {
  if (!window.firebase || !window.STUDENT_TRACKER_CONFIG) return;

  if (!firebase.apps.length) {
    firebase.initializeApp(STUDENT_TRACKER_CONFIG.firebase);
  }

  const db = firebase.database();
  const studentId = STUDENT_TRACKER_CONFIG.getStudentId();
  const sessionId = Date.now() + '_' + Math.random().toString(36).slice(2);
  const pagePath = location.pathname || location.href;
  const startTime = Date.now();
  let lastActive = Date.now();
  let idleMs = 0;

  function deviceInfo() {
    const ua = navigator.userAgent || '';
    return {
      deviceType: /mobi|android/i.test(ua) ? 'mobile' : 'desktop',
      browser:
        ua.includes('Firefox') ? 'Firefox' :
        ua.includes('Edg') ? 'Edge' :
        ua.includes('Chrome') ? 'Chrome' :
        ua.includes('Safari') ? 'Safari' : 'Unknown',
      screen: `${screen.width}x${screen.height}`
    };
  }

  const baseRef = db.ref(`activity/${studentId}/${sessionId}`);

  /* SESSION START */
  baseRef.set({
    studentId,
    sessionId,
    page: pagePath,
    referrer: document.referrer || '',
    startedAt: new Date().toISOString(),
    device: deviceInfo(),
    events: {}
  });

  /* EVENTS */
  function logEvent(type, data = {}) {
    lastActive = Date.now();
    baseRef.child('events').push({
      type,
      data,
      ts: new Date().toISOString()
    });
  }

  /* PAGE VISIBILITY */
  document.addEventListener('visibilitychange', () => {
    logEvent(document.hidden ? 'tab_hidden' : 'tab_visible');
  });

  /* CLICKS */
  document.addEventListener('click', e => {
    const t = e.target;
    logEvent('click', {
      tag: t.tagName,
      id: t.id || null,
      class: t.className || null
    });
  });

  /* FORM INTERACTIONS (NO VALUES) */
  document.addEventListener('input', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      logEvent('form_interaction', {
        name: e.target.name || e.target.id || 'unnamed',
        type: e.target.type || 'text'
      });
    }
  });

  /* COPY / PASTE (NO CONTENT) */
  document.addEventListener('copy', () => logEvent('copy'));
  document.addEventListener('paste', () => logEvent('paste'));

  /* IDLE TRACKING */
  setInterval(() => {
    const now = Date.now();
    if (now - lastActive > 60000) idleMs += 10000;
  }, 10000);

  /* SESSION END */
  window.addEventListener('beforeunload', () => {
    baseRef.update({
      endedAt: new Date().toISOString(),
      durationSec: Math.round((Date.now() - startTime) / 1000),
      idleSec: Math.round(idleMs / 1000)
    });
  });
})();
</script>
