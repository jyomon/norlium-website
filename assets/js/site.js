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
    link.addEventListener('click', () => {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation menu');
    });
  });
}

const enquiryForm = document.querySelector('#enquiry-form');
const formMessage = document.querySelector('#form-message');

if (enquiryForm && formMessage) {
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
    const message = enquiryForm.querySelector('#message').value.trim();

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
