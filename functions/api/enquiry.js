export async function onRequestPost(context) {
  try {
    const request = context.request;

    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return jsonResponse(
        { success: false, message: 'Invalid request format.' },
        415
      );
    }

    const data = await request.json();

    const name = cleanText(data.name, 100);
    const email = cleanText(data.email, 254);
    const company = cleanText(data.company, 150);
    const telephone = cleanText(data.telephone, 50);
    const preferredContact = cleanText(data.preferredContact, 20);
    const service = cleanText(data.service, 100);
    const message = cleanText(data.message, 2000);
    const websiteAddress = cleanText(data.websiteAddress, 200);

    const informationConfirmed = data.informationConfirmed === true;
    const privacyConfirmed = data.privacyConfirmed === true;

    // Honeypot: legitimate visitors should never complete this field.
    if (websiteAddress) {
      return jsonResponse(
        {
          success: true,
          message: 'Your enquiry has been received.'
        },
        200
      );
    }

    if (!name || !email || !service || !message) {
      return jsonResponse(
        {
          success: false,
          message: 'Please complete all required fields.'
        },
        400
      );
    }

    if (!isValidEmail(email)) {
      return jsonResponse(
        {
          success: false,
          message: 'Please enter a valid email address.'
        },
        400
      );
    }

    if (message.length < 10) {
      return jsonResponse(
        {
          success: false,
          message: 'Please provide a little more information about your enquiry.'
        },
        400
      );
    }

    if (!informationConfirmed || !privacyConfirmed) {
      return jsonResponse(
        {
          success: false,
          message: 'Please confirm the declarations before submitting.'
        },
        400
      );
    }

    const allowedServices = [
      'home',
      'business',
      'digital',
      'website',
      'linux',
      'other'
    ];

    if (!allowedServices.includes(service)) {
      return jsonResponse(
        {
          success: false,
          message: 'Please select a valid service.'
        },
        400
      );
    }

    const allowedContactMethods = [
      'Email',
      'Telephone',
      'WhatsApp'
    ];

    if (!allowedContactMethods.includes(preferredContact)) {
      return jsonResponse(
        {
          success: false,
          message: 'Invalid preferred contact method.'
        },
        400
      );
    }

    const formsparkResponse = await fetch(
      'https://submit-form.com/4Adim92PZ',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          company: company || 'Not provided',
          telephone: telephone || 'Not provided',
          preferredContact,
          service,
          message,
          informationConfirmed,
          privacyConfirmed,
          source: 'Norlium website'
        })
      }
    );

    if (!formsparkResponse.ok) {
      console.error(
        'Formspark submission failed:',
        formsparkResponse.status
      );

      return jsonResponse(
        {
          success: false,
          message:
            'We could not send your enquiry. Please try again later.'
        },
        502
      );
    }

    return jsonResponse(
      {
        success: true,
        message: 'Your enquiry has been received.'
      },
      200
    );
  } catch (error) {
    console.error('Enquiry submission error:', error);

    return jsonResponse(
      {
        success: false,
        message:
          'We could not process your enquiry. Please try again later.'
      },
      500
    );
  }
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-store'
    }
  });
}
