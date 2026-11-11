export const NEW_HIGH_SPEC_MINIMUM = 500;
export const minimumBudgetNote = `For a new device with higher performance, choose a budget of £${NEW_HIGH_SPEC_MINIMUM} or more, or select Not sure for advice.`;

const budgetFloors = new Map([
  ['Under £200', 0], ['£200–£299', 200], ['£300–£499', 300],
  ['£500–£799', 500], ['£800–£1,199', 800], ['£1,200 or more', 1200],
  ['Not sure', Infinity]
]);
const deviceTypes = ['Laptop', 'Desktop PC', 'Mini PC', 'Monitor or accessories', 'Not sure'];
const conditions = ['New', 'Refurbished', 'Either / please advise'];
const intendedUses = ['Everyday use', 'Work / business', 'University / study', 'Gaming', 'Design / video', 'AI / machine learning', 'Other / not sure'];
const sharedFeatures = ['Webcam', 'No preference'];
const computerFeatures = [...sharedFeatures, 'Easy to carry', 'Long battery life', 'Windows', 'More storage', 'Higher performance'];
const accessoryFeatures = [...sharedFeatures, 'HDMI or DisplayPort', 'USB-C connectivity', 'Adjustable monitor stand'];
const sharedSupport = ['Device only', 'Initial setup', 'Buying advice'];
const computerSupport = [...sharedSupport, 'Data transfer'];
const screenSizes = ['', '13–14 inches', '15–16 inches', '17 inches or larger', 'No preference'];

export function isAccessory(device) {
  return device === 'Monitor or accessories';
}

export function needsMinimumBudget({ device, condition, features }) {
  return !isAccessory(device) && condition === 'New' && features.includes('Higher performance');
}

export function isBelowMinimumBudget(budget) {
  return budgetFloors.get(budget) < NEW_HIGH_SPEC_MINIMUM;
}

function validSelections(values, allowed, exclusive) {
  return Array.isArray(values) && values.length <= allowed.length
    && values.every(value => allowed.includes(value))
    && new Set(values).size === values.length
    && (!exclusive || !values.includes(exclusive) || values.length === 1);
}

export function validateDeviceRequest(data) {
  if (!data || !deviceTypes.includes(data.device) || !conditions.includes(data.condition) || !budgetFloors.has(data.budget)) {
    return 'Choose a device type, condition and budget.';
  }
  if (!validSelections(data.uses, intendedUses) || !data.uses.length) {
    return 'Choose at least one intended use.';
  }

  const accessory = isAccessory(data.device);
  const validScreen = data.device === 'Laptop' ? screenSizes.includes(data.screen) : data.screen === '';
  if (!validScreen
      || !validSelections(data.features, accessory ? accessoryFeatures : computerFeatures, 'No preference')
      || !validSelections(data.support, accessory ? sharedSupport : computerSupport, 'Device only')) {
    return 'Check the requirements available for your selected device.';
  }
  if (needsMinimumBudget(data) && isBelowMinimumBudget(data.budget)) return minimumBudgetNote;
  if (typeof data.notes !== 'string' || data.notes.length > 700
      || typeof data.postcode !== 'string' || data.postcode.length > 12) {
    return 'Check the length of your postcode and additional requirements.';
  }

  return '';
}

export function formatDeviceRequest(data) {
  return [
    'DEVICE REQUEST & BUYING ADVICE',
    'Device: ' + data.device,
    'Condition: ' + data.condition,
    'Uses: ' + data.uses.join(', '),
    'Budget: ' + data.budget,
    'Laptop screen: ' + (data.device === 'Laptop' ? data.screen || 'No preference' : 'Not applicable'),
    'Features: ' + (data.features.join(', ') || 'Please advise'),
    'Support: ' + (data.support.join(', ') || 'Please advise'),
    'Postcode: ' + (data.postcode || 'Not provided'),
    'Additional requirements: ' + (data.notes || 'None')
  ].join('\n');
}
