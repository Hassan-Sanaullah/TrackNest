(function(w, d, u) {
  // Setup a global queue function
  const q = w.TrackNest = w.TrackNest || function() {
    (q.q = q.q || []).push(arguments);
  };

  let websiteId = null;

  // Generate or get persistent sessionId stored in localStorage
  function getSessionId() {
    let sid = localStorage.getItem('mp_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mp_session_id', sid);
    }
    return sid;
  }

  // Extract domain (without protocol)
  function getDomain() {
    return window.location.hostname;
  }

  // Send event data to your API endpoint with required header x-domain
  function sendEvent(eventData) {
    if (!websiteId) {
      console.warn('TrackNest: websiteId not initialized');
      return;
    }

    const body = JSON.stringify({
      ...eventData,
      websiteId,
    });

    const headers = {
      'Content-Type': 'application/json',
      'x-domain': getDomain(),
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(u, blob);
    } else {
      fetch(u, {
        method: 'POST',
        headers,
        body,
        keepalive: true,
      });
    }
  }

  // Send a page_view event
  function trackPageView() {
    const event = {
      eventType: 'page_view',
      url: window.location.pathname + window.location.search,
      sessionId: getSessionId(),
      referrer: document.referrer || undefined,
    };

    sendEvent(event);
  }

  // Handle queued commands
  function processQueue() {
    if (!q.q) return;
    q.q.forEach(function(args) {
      handleCommand.apply(null, args);
    });
    q.q = [];
  }

  // Handle commands like init, custom events in future
  function handleCommand(command, value) {
    if (command === 'init') {
      websiteId = value;
      trackPageView(); // Send page_view once initialized
    }
    // You can add more commands like TrackNest('event', { eventType: 'click', ... })
  }

  // Assign handler directly to global
  q.process = processQueue;
  q.cmd = handleCommand;

  // DOM ready logic
  function onReady() {
    processQueue(); // Process queued commands like init
  }

  if (d.readyState === 'complete' || d.readyState === 'interactive') {
    onReady();
  } else {
    d.addEventListener('DOMContentLoaded', onReady);
  }

})(window, document, 'http://localhost:3000/events/track');
