(function(w, d, u) {
  const q = w.TrackNest = w.TrackNest || function() {
    (q.q = q.q || []).push(arguments);
  };

  let websiteId = null;

  function getSessionId() {
    let sid = localStorage.getItem('mp_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mp_session_id', sid);
      console.log('[TrackNest] New session ID generated:', sid);
    } else {
      console.log('[TrackNest] Existing session ID used:', sid);
    }
    return sid;
  }

  function getDomain() {
    const domain = window.location.hostname;
    console.log('[TrackNest] Domain:', domain);
    return domain;
  }

  function sendEvent(eventData) {
    if (!websiteId) {
      console.warn('[TrackNest] websiteId not initialized, cannot send event');
      return;
    }

    const payload = {
      ...eventData,
      websiteId,
    };

    const body = JSON.stringify(payload);

    const headers = {
      'Content-Type': 'application/json',
      'x-domain': getDomain(),
    };

    console.log('[TrackNest] Sending event:', payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const success = navigator.sendBeacon(u, blob);
      console.log('[TrackNest] Event sent with sendBeacon:', success);
    } else {
      fetch(u, {
        method: 'POST',
        headers,
        body,
        keepalive: true,
      })
      .then(res => console.log('[TrackNest] Event sent with fetch. Status:', res.status))
      .catch(err => console.error('[TrackNest] Fetch error:', err));
    }
  }

  function trackPageView() {
    const event = {
      eventType: 'page_view',
      url: window.location.pathname + window.location.search,
      sessionId: getSessionId(),
      referrer: document.referrer || undefined,
    };

    console.log('[TrackNest] Tracking page view');
    sendEvent(event);
  }

  function processQueue() {
    if (!q.q) return;
    console.log('[TrackNest] Processing queue with', q.q.length, 'item(s)');
    q.q.forEach(function(args) {
      handleCommand.apply(null, args);
    });
    q.q = [];
  }

  function handleCommand(command, value) {
    console.log('[TrackNest] Command received:', command, value);

    if (command === 'init') {
      websiteId = value;
      console.log('[TrackNest] Initialized with websiteId:', websiteId);
      trackPageView();
    } else if (command === 'event') {
      console.log('[TrackNest] Handling custom event:', value);
      if (typeof value === 'object' && value !== null) {
        value.sessionId = getSessionId();
        sendEvent(value);
      } else {
        console.warn('[TrackNest] Event command requires an event object:', value);
      }
    } else {
      console.warn('[TrackNest] Unknown command received:', command, value);
    }
  }

  q.process = processQueue;
  q.cmd = handleCommand;

  function onReady() {
    console.log('[TrackNest] DOM ready, processing command queue');
    processQueue();
  }

  if (d.readyState === 'complete' || d.readyState === 'interactive') {
    onReady();
  } else {
    d.addEventListener('DOMContentLoaded', onReady);
  }
})(window, document, 'http://localhost:3000/events/track');
