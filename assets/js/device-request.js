import {
  formatDeviceRequest, isAccessory, isBelowMinimumBudget, minimumBudgetNote, needsMinimumBudget
} from './device-request-rules.js';

const icons = {
  laptop: '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="m4 16-2 3h20l-2-3"/>',
  desktop: '<rect x="3" y="4" width="12" height="11" rx="1.5"/><path d="M9 15v4m-4 0h8"/><rect x="17" y="3" width="4" height="17" rx="1"/><path d="M19 6h.01"/>',
  mini: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 12h.01m4 0h.01m4 0h2"/>',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4m-4 0h8"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .3c0 1.7-2.5 2.1-2.5 3.7m0 3h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  settings: '<path d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h2m4 0h10"/><circle cx="12" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  review: '<path d="M9 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/><rect x="9" y="2.5" width="6" height="4" rx="1"/><path d="m8 13 3 3 5-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>'
};

function iconMarkup(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

for (const icon of document.querySelectorAll('.device-enquiry [data-icon]')) icon.innerHTML = iconMarkup(icon.dataset.icon);

const form = document.querySelector('#device-request-form');
const submissionStatus = document.querySelector('#device-request-status');
const panels = [...form.querySelectorAll('.panel')];
const steps = [...document.querySelectorAll('#progress li')];
const meter = [...document.querySelectorAll('.meter b')];
const mobileStep = document.querySelector('#mobile-step');
const mobileLabel = document.querySelector('#mobile-label');
const screenField = document.querySelector('#screen-field');
const screen = form.elements.screen;
const budgetOptions = [...form.querySelectorAll('[name="budget"]')];
const budgetRule = document.querySelector('#budget-rule');
const requirementsBudget = document.querySelector('#requirements-budget');
const requirementsBudgetText = document.querySelector('#requirements-budget-text');
const review = document.querySelector('#review-sections');
const validationGroups = new Map([...form.querySelectorAll('[data-validate]')].map(group => [group.dataset.validate, group]));

const stepNames = ['Device & budget', 'Requirements', 'Contact details', 'Review'];
const stepFields = [['device', 'condition', 'budget'], ['use'], ['name', 'email', 'accuracy', 'privacy']];

let currentStep = 0;
let editing = false;
let sending = false;

function checked(name) {
  return [...form.querySelectorAll(`[name="${name}"]:checked:not(:disabled)`)];
}

function selected(name) {
  return checked(name)[0]?.value || '';
}

function updateOptions() {
  const device = selected('device');
  const accessory = isAccessory(device);
  screenField.hidden = device !== 'Laptop';
  screen.disabled = screenField.hidden;
  if (screen.disabled) screen.value = '';

  for (const label of form.querySelectorAll('[data-computer], [data-accessory]')) {
    const input = label.querySelector('input');
    label.hidden = label.hasAttribute('data-computer') ? accessory : !accessory;
    input.disabled = label.hidden;
    if (input.disabled) input.checked = false;
  }

  const highSpec = needsMinimumBudget({
    device,
    condition: selected('condition'),
    features: checked('features').map(input => input.value)
  });
  for (const input of budgetOptions) {
    input.disabled = highSpec && isBelowMinimumBudget(input.value);
    if (input.disabled) input.checked = false;
  }

  budgetRule.hidden = !highSpec;
  budgetRule.textContent = highSpec ? minimumBudgetNote : '';
  requirementsBudget.hidden = !highSpec || Boolean(selected('budget'));
  requirementsBudgetText.textContent = requirementsBudget.hidden ? '' : minimumBudgetNote;
}

const errors = {
  device: () => selected('device') ? '' : 'Choose a device type or select Not sure.',
  condition: () => selected('condition') ? '' : 'Choose a preferred condition.',
  budget: () => selected('budget') ? '' : budgetRule.hidden ? 'Choose a budget or select Not sure.' : minimumBudgetNote,
  use: () => selected('use') ? '' : 'Choose at least one use, or select Other / not sure.',
  name: () => form.elements.name.value.trim() ? '' : 'Enter a name.',
  email: () => {
    const email = form.elements.email;
    if (!email.value.trim()) return 'Enter an email address.';
    return email.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? 'Enter an email address in the format name@example.com.' : '';
  },
  accuracy: () => form.elements.accuracy.checked ? '' : 'Confirm that the details are accurate.',
  privacy: () => form.elements.privacy.checked ? '' : 'Acknowledge the privacy statement to continue.'
};

function showError(field, message) {
  const group = validationGroups.get(field);
  const error = document.querySelector(`#${field}-error`);
  error.textContent = message;
  error.hidden = !message;
  for (const input of group.querySelectorAll('input')) {
    if (message && !input.disabled) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
}

function validateStep(index) {
  let first = '';
  for (const field of stepFields[index]) {
    const message = errors[field]();
    showError(field, message);
    if (message && !first) first = field;
  }
  return first;
}

function focusField(name) {
  validationGroups.get(name).querySelector('input:checked:not(:disabled), input:not(:disabled)').focus();
}

function showStep(index, focus = true) {
  currentStep = index;
  updateSubmissionStatus('');
  panels.forEach((panel, position) => {
    panel.hidden = index !== position;
    const submit = panel.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = panel.hidden;
      if (position < 3) {
        submit.firstChild.textContent = editing ? 'Save changes ' : position === 2 ? 'Review enquiry ' : 'Continue ';
      }
    }
  });

  steps.forEach((item, position) => {
    if (position === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
    item.classList.toggle('complete', position < index);
    const number = item.querySelector('.step-number');
    if (position < index) number.innerHTML = `<i class="icon">${iconMarkup('check')}</i>`;
    else number.textContent = position + 1;
  });

  mobileStep.textContent = index < steps.length ? `Step ${index + 1} of ${steps.length}` : 'Enquiry complete';
  mobileLabel.textContent = index < steps.length ? stepNames[index] : '';
  meter.forEach((bar, position) => bar.classList.toggle('filled', position <= index));

  if (focus) {
    const progress = document.querySelector('.mobile-progress');
    const scrollTarget = progress.getClientRects().length ? progress : form;
    scrollTarget.scrollIntoView({ block: 'start', behavior: 'instant' });
    panels[index].querySelector('h2').focus({ preventScroll: true });
  }
}

function createReviewGroup(name, step, rows) {
  const group = document.createElement('section');
  group.className = 'review-group';
  const header = document.createElement('header');
  const title = document.createElement('h3');
  title.textContent = name;
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'text-button';
  edit.textContent = 'Edit';
  edit.dataset.edit = step;
  edit.setAttribute('aria-label', `Edit ${name.toLowerCase()}`);
  header.append(title, edit);

  const list = document.createElement('dl');
  for (const [label, value] of rows) {
    const row = document.createElement('div');
    row.className = 'review-row';
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value || 'Not provided';
    row.append(term, detail);
    list.append(row);
  }
  group.append(header, list);
  return group;
}

function updateReview() {
  const data = new FormData(form);
  const list = name => data.getAll(name).join(', ');
  const text = name => (data.get(name) || '').trim();
  const requirements = [['Intended use', list('use')]];
  if (!screen.disabled) requirements.push(['Screen size', text('screen') || 'No preference']);
  requirements.push(['Features', list('features') || 'No preference'], ['Support', list('support')], ['Additional notes', text('notes')]);

  review.replaceChildren(
    createReviewGroup(stepNames[0], 0, [['Device', text('device')], ['Condition', text('condition')], ['Budget', text('budget')]]),
    createReviewGroup(stepNames[1], 1, requirements),
    createReviewGroup(stepNames[2], 2, [['Name', text('name')], ['Email', text('email')], ['Postcode', text('postcode')], ['Acknowledgements', 'Details and privacy acknowledged']])
  );
}

function returnToInvalidStep(index, field) {
  showStep(index);
  focusField(field);
}

function showReview() {
  editing = false;
  updateReview();
  showStep(3);
}

form.addEventListener('change', event => {
  const input = event.target;
  if (input.type === 'checkbox' && input.checked && ['features', 'support'].includes(input.name)) {
    for (const other of checked(input.name)) {
      if (other !== input && (input.hasAttribute('data-exclusive') || other.hasAttribute('data-exclusive'))) {
        other.checked = false;
      }
    }
  }
  updateOptions();
  const group = input.closest('[data-validate]');
  if (group && !errors[group.dataset.validate]()) showError(group.dataset.validate, '');
});

form.addEventListener('input', event => {
  const { name, type } = event.target;
  if (['email', 'text'].includes(type) && errors[name] && !errors[name]()) showError(name, '');
});

form.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || sending) return;
  if (button.hasAttribute('data-edit')) {
    editing = true;
    showStep(Number(button.dataset.edit));
  } else if (button.hasAttribute('data-go')) {
    showStep(Number(button.dataset.go));
    if (button.dataset.focus) focusField(button.dataset.focus);
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending) return;
  updateOptions();

  if (currentStep < 3) {
    const invalid = validateStep(currentStep);
    if (invalid) {
      focusField(invalid);
      return;
    }
    if (!editing && currentStep < 2) {
      if (!requirementsBudget.hidden && currentStep === 1) {
        showError('budget', errors.budget());
        returnToInvalidStep(0, 'budget');
        return;
      }
      showStep(currentStep + 1);
      return;
    }
  }

  for (const index of stepFields.keys()) {
    const invalid = validateStep(index);
    if (invalid) {
      returnToInvalidStep(index, invalid);
      return;
    }
  }

  if (currentStep === 3) {
    await sendEnquiry();
  } else if (currentStep < 3) {
    showReview();
  }
});

function updateSubmissionStatus(message, error = false) {
  submissionStatus.hidden = !message;
  submissionStatus.toggleAttribute('data-error', error);
  submissionStatus.textContent = message;
}

function enquiryPayload() {
  const data = new FormData(form);
  const text = name => (data.get(name) || '').trim();
  const deviceRequest = {
    device: text('device'),
    condition: text('condition'),
    budget: text('budget'),
    uses: data.getAll('use'),
    screen: text('screen'),
    features: data.getAll('features'),
    support: data.getAll('support'),
    notes: text('notes'),
    postcode: text('postcode')
  };

  return {
    name: text('name'),
    email: text('email'),
    company: '',
    telephone: '',
    preferredContact: 'Email',
    service: 'device-sourcing',
    message: formatDeviceRequest(deviceRequest),
    deviceRequest,
    websiteAddress: text('website-address'),
    informationConfirmed: data.has('accuracy'),
    privacyConfirmed: data.has('privacy')
  };
}

async function sendEnquiry() {
  const buttons = [...panels[3].querySelectorAll('button')];
  sending = true;
  for (const button of buttons) button.disabled = true;
  updateSubmissionStatus('Sending your device enquiry…');

  let error = '';
  const fallback = 'We could not send your enquiry. Please try again or email contact@norlium.co.uk.';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(enquiryPayload())
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true) error = result?.message || fallback;
  } catch {
    error = fallback;
  } finally {
    sending = false;
    for (const button of buttons) button.disabled = false;
  }

  if (error) {
    updateSubmissionStatus(error, true);
    submissionStatus.focus();
    return;
  }

  form.reset();
  review.replaceChildren();
  updateOptions();
  showStep(4);
}

document.querySelector('#start-over').addEventListener('click', () => showStep(0));
updateOptions();
showStep(0, false);
form.hidden = false;
