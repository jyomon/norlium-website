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

  function updateTelephoneRequirement() {
    const needsTelephone =
      preferredContactSelect.value === 'Telephone' ||
      preferredContactSelect.value === 'WhatsApp';

    telephoneInput.required = needsTelephone;
  }

  preferredContactSelect.addEventListener('change', updateTelephoneRequirement);
  enquiryForm.addEventListener('reset', () => {
    telephoneInput.required = false;
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
