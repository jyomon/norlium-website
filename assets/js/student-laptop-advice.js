const form = document.querySelector('#student-advice-form');
const button = form.querySelector('button[type="submit"]');
const status = document.querySelector('#student-request-status');
const fallback = 'We couldn’t send your request. Please try again or email contact@norlium.co.uk.';

function showStatus(message, state) {
  status.textContent = message;
  status.dataset.state = state;
  status.hidden = false;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled) return;

  const data = new FormData(form);
  const text = field => data.get(field).trim();
  const confirmed = data.has('consent');
  const details = [
    ['Course or subject', text('course')],
    ['University or college', text('institution')],
    ['Software or course requirements', text('requirements')],
    ['Budget', text('budget')]
  ];
  const message = [
    'STUDENT LAPTOP ADVICE',
    ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`)
  ].join('\n');

  button.disabled = true;
  showStatus('Sending your request…', 'pending');

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: text('name'),
        email: text('email'),
        preferredContact: 'Email',
        service: 'device-sourcing',
        message,
        websiteAddress: text('website'),
        informationConfirmed: confirmed,
        privacyConfirmed: confirmed
      })
    });
    const result = await response.json().catch(() => null);

    if (response.ok && result?.success === true) {
      form.reset();
      showStatus('Thank you. We’ve received your request and will reply by email with laptop advice for your course.', 'success');
    } else {
      showStatus(typeof result?.message === 'string' && result.message.trim() ? result.message : fallback, 'error');
    }
  } catch {
    showStatus(fallback, 'error');
  } finally {
    button.disabled = false;
    status.focus();
  }
});

form.hidden = false;
