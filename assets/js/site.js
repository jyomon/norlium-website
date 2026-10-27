'use strict';

const menuButton = document.querySelector('.menu');
const navigation = document.querySelector('#main-navigation');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');

    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute(
      'aria-label',
      isOpen ? 'Close navigation menu' : 'Open navigation menu'
    );
  });

  document.querySelectorAll('#main-navigation a').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');

      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation menu');

      // Preserve normal browser navigation on desktop
      // and for links to other pages.
      if (
        !window.matchMedia('(max-width: 800px)').matches ||
        !href ||
        !href.startsWith('#')
      ) return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      event.preventDefault();

      const header = document.querySelector('.site-header');
      const headerHeight = header
        ? header.getBoundingClientRect().height
        : 0;

      // Calculate the destination after the menu has closed.
      requestAnimationFrame(() => {
        const targetTop =
          window.scrollY +
          target.getBoundingClientRect().top -
          headerHeight -
          12;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'instant'
        });

        history.replaceState(null, '', href);
      });
    });
  });
}

const enquiryForm = document.querySelector('#enquiry-form');
const formMessage = document.querySelector('#form-message');

if (enquiryForm && formMessage) {
  const preferredContactSelect = enquiryForm.querySelector('#preferred-contact');
  const telephoneInput = enquiryForm.querySelector('#telephone');
  const serviceSelect = enquiryForm.querySelector('#service-type');
  const deviceFields = enquiryForm.querySelector('#device-enquiry-fields');

  function updateDeviceFields() {
    const active = serviceSelect.value === 'device-sourcing';
    deviceFields.hidden = !active;

    for (const field of deviceFields.querySelectorAll('input, select, textarea')) {
      field.required = active && field.id !== 'device-budget';
      field.disabled = !active;
    }
  }

  serviceSelect.addEventListener('change', updateDeviceFields);

  // Preselect device advice for visitors arriving from the online shop.
  const enquiryParams = new URLSearchParams(window.location.search);
  const requestedService = enquiryParams.get('service');

  if (
    ['device-sourcing', 'cybersecurity'].includes(requestedService) &&
    window.location.hash === '#enquiry-form'
  ) {
    serviceSelect.value = requestedService;
  }

  updateDeviceFields();

  function updateTelephoneRequirement() {
    const needsTelephone =
      preferredContactSelect.value === 'Telephone' ||
      preferredContactSelect.value === 'WhatsApp';

    telephoneInput.required = needsTelephone;
  }

  preferredContactSelect.addEventListener('change', updateTelephoneRequirement);
  enquiryForm.addEventListener('reset', () => {
    telephoneInput.required = false;
    requestAnimationFrame(updateDeviceFields);
  });
  updateTelephoneRequirement();

  enquiryForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!enquiryForm.reportValidity()) {
      return;
    }

    const submitButton = enquiryForm.querySelector(
      'button[type="submit"]'
    );

    const name = enquiryForm.querySelector('#name').value.trim();
    const email = enquiryForm
      .querySelector('#contact-method')
      .value.trim();
    const company = enquiryForm.querySelector('#company').value.trim();
    const telephone = enquiryForm
      .querySelector('#telephone')
      .value.trim();
    const preferredContact = enquiryForm.querySelector(
      '#preferred-contact'
    ).value;
    const service = enquiryForm.querySelector('#service-type').value;
    let message = enquiryForm.querySelector('#message').value.trim();

    if (service === 'device-sourcing') {
      const deviceType = enquiryForm.querySelector('#device-type').value;
      const deviceUse = enquiryForm.querySelector('#device-use').value.trim();
      const condition = enquiryForm.querySelector('#device-condition').value;
      const budget = enquiryForm.querySelector('#device-budget').value.trim();

      message = [
        'PERSONALISED DEVICE SOURCING ENQUIRY',
        'Device: ' + deviceType,
        'Intended use: ' + deviceUse,
        'Condition: ' + condition,
        'Budget: ' + (budget || 'Not specified'),
        '',
        'Additional information:',
        message
      ].join('\n');

      if (message.length > 2000) {
        formMessage.hidden = false;
        formMessage.textContent =
          'Please shorten your device requirements or additional information.';
        return;
      }
    }

    const websiteAddress = enquiryForm
      .querySelector('#website-address')
      .value.trim();

    const informationConfirmed = enquiryForm.querySelector(
      '[name="information-confirmed"]'
    ).checked;

    const privacyConfirmed = enquiryForm.querySelector(
      '[name="privacy-confirmed"]'
    ).checked;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';

    formMessage.hidden = false;
    formMessage.textContent = 'Sending your enquiry…';

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          company,
          telephone,
          preferredContact,
          service,
          message,
          websiteAddress,
          informationConfirmed,
          privacyConfirmed
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to send your enquiry.'
        );
      }

      enquiryForm.reset();

      formMessage.textContent =
        'Thank you. Your enquiry has been received by Norlium Technology. ' +
        'We will respond using your preferred contact method.';

      formMessage.focus();
    } catch (error) {
      console.error('Enquiry submission failed:', error);

      formMessage.textContent =
        error.message ||
        'We could not send your enquiry. Please try again later.';

      formMessage.focus();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Enquiry';
    }
  });
}
