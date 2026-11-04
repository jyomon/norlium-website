'use strict';

const deviceRequest = document.querySelector('#device-request-form');
if (deviceRequest) {
  const status = document.querySelector('#device-request-status');
  const screenPreference = document.querySelector('#screen-preference');
  const updateScreen = () => {
    const laptop = deviceRequest.querySelector('[name="device"]:checked')?.value === 'Laptop';
    screenPreference.hidden = !laptop;
    screenPreference.querySelector('select').disabled = !laptop;

    const accessories = deviceRequest.querySelector(
      '[name="device"]:checked'
    )?.value === 'Monitor or accessories';

    for (const field of deviceRequest.querySelectorAll('[name="features"]')) {
      if (['Long battery life', 'More storage'].includes(field.value)) {
        field.disabled = accessories;
        field.closest('label').hidden = accessories;
        if (accessories) field.checked = false;
      }
    }
  };
  deviceRequest.addEventListener('change', updateScreen);
  deviceRequest.addEventListener('reset', () => requestAnimationFrame(updateScreen));
  deviceRequest.addEventListener('submit', async event => {
    event.preventDefault();
    if (!deviceRequest.reportValidity()) return;
    const data = new FormData(deviceRequest);
    const selections = name => data.getAll(name).join(', ') || 'Please advise';
    const message = [
      'DEVICE REQUEST & BUYING ADVICE',
      'Device: ' + selections('device'),
      'Condition: ' + selections('condition'),
      'Uses: ' + selections('use'),
      'Budget: ' + selections('budget'),
      'Laptop screen: ' + (data.get('screen') || 'Not applicable'),
      'Features: ' + selections('features'),
      'Support: ' + selections('support'),
      'Postcode: ' + (data.get('postcode')?.trim() || 'Not provided'),
      'Additional requirements: ' + (data.get('requirements')?.trim() || 'None')
    ].join('\n');
    const button = deviceRequest.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';
    status.hidden = false;
    status.textContent = 'Sending your device request…';
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify({
          name: data.get('name').trim(), email: data.get('email').trim(),
          company: '', telephone: '', preferredContact: 'Email', service: 'device-sourcing',
          message, websiteAddress: data.get('website-address').trim(),
          informationConfirmed: data.has('information-confirmed'),
          privacyConfirmed: data.has('privacy-confirmed')
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.message || 'We could not send your request. Please try again or email contact@norlium.co.uk.');
      deviceRequest.reset();
      status.textContent = 'Thank you. Your device request has been received. Norlium will respond by email. This is an enquiry, not an order.';
    } catch (error) {
      status.textContent = error.message || 'We could not send your request. Please try again or email contact@norlium.co.uk.';
    } finally {
      button.disabled = false;
      button.textContent = 'Send Device Request';
      status.focus();
    }
  });
}
