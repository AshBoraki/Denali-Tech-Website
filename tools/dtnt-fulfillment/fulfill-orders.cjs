const fs = require("fs");
const path = require("path");
const https = require("https");
const { createActivationDocument, getLicenseHint } = require("./license.cjs");

const repoRoot = path.resolve(__dirname, "..", "..");
const ordersDir = path.join(repoRoot, "Net-tools", "orders");
const licensesDir = path.join(repoRoot, "Net-tools", "licenses");

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

const config = {
  stripeSecretKey: requireEnv("STRIPE_SECRET_KEY"),
  activationPrivateKeyPem: Buffer.from(requireEnv("DTNT_ACTIVATION_PRIVATE_KEY_BASE64"), "base64").toString("utf8"),
  productCode: process.env.DTNT_PRODUCT_CODE || "DTNT-PRO",
  paymentLinkId: process.env.DTNT_PAYMENT_LINK_ID || "",
  productId: process.env.DTNT_PRODUCT_ID || "",
  priceId: process.env.DTNT_PRICE_ID || "",
  expectedAmount: Number(process.env.DTNT_PRICE_AMOUNT || 5900),
  downloadUrl: process.env.DTNT_DOWNLOAD_URL || "https://denalitechs.com/Net-tools/",
  supportEmail: process.env.DTNT_SUPPORT_EMAIL || "Hello@denalitechs.com"
};

function stripeRequest(requestPath) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: "api.stripe.com",
      path: requestPath,
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.stripeSecretKey}`,
        "Stripe-Version": "2026-02-25.clover"
      }
    }, response => {
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        const payload = body ? JSON.parse(body) : {};
        if (response.statusCode >= 400) {
          reject(new Error(payload.error && payload.error.message
            ? payload.error.message
            : `Stripe request failed with ${response.statusCode}.`));
          return;
        }

        resolve(payload);
      });
    });

    request.on("error", reject);
    request.end();
  });
}

async function listCheckoutSessions() {
  const sessions = [];
  let startingAfter = "";

  for (let page = 0; page < 5; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (startingAfter) {
      params.set("starting_after", startingAfter);
    }

    const payload = await stripeRequest(`/v1/checkout/sessions?${params.toString()}`);
    const pageSessions = Array.isArray(payload.data) ? payload.data : [];
    sessions.push(...pageSessions);

    if (!payload.has_more || pageSessions.length === 0) {
      break;
    }

    startingAfter = pageSessions[pageSessions.length - 1].id;
  }

  return sessions;
}

async function listPaymentIntents() {
  const paymentIntents = [];
  let startingAfter = "";

  for (let page = 0; page < 5; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (startingAfter) {
      params.set("starting_after", startingAfter);
    }

    const payload = await stripeRequest(`/v1/payment_intents?${params.toString()}`);
    const pagePaymentIntents = Array.isArray(payload.data) ? payload.data : [];
    paymentIntents.push(...pagePaymentIntents);

    if (!payload.has_more || pagePaymentIntents.length === 0) {
      break;
    }

    startingAfter = pagePaymentIntents[pagePaymentIntents.length - 1].id;
  }

  return paymentIntents;
}

async function listLineItems(sessionId) {
  const payload = await stripeRequest(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100`);
  return Array.isArray(payload.data) ? payload.data : [];
}

async function getCharge(chargeId) {
  if (!chargeId) {
    return null;
  }

  return stripeRequest(`/v1/charges/${encodeURIComponent(chargeId)}`);
}

async function sessionMatches(session) {
  if (!session || session.payment_status !== "paid" || session.status !== "complete") {
    return false;
  }

  if (config.paymentLinkId && session.payment_link === config.paymentLinkId) {
    return true;
  }

  if (!config.priceId && !config.productId) {
    return false;
  }

  const lineItems = await listLineItems(session.id);
  return lineItems.some(item => {
    const price = item.price || {};
    const productId = typeof price.product === "string" ? price.product : price.product && price.product.id;
    return (config.priceId && price.id === config.priceId)
      || (config.productId && productId === config.productId);
  });
}

async function paymentIntentMatches(paymentIntent) {
  if (!paymentIntent || paymentIntent.status !== "succeeded") {
    return false;
  }

  if (config.expectedAmount && paymentIntent.amount !== config.expectedAmount) {
    return false;
  }

  return true;
}

function getLicensedTo(session) {
  const customerDetails = session.customer_details || {};
  return customerDetails.email
    || customerDetails.name
    || session.customer_email
    || "DTNT Pro Customer";
}

function getLicensedToFromPaymentIntent(paymentIntent, charge) {
  const billingDetails = charge && charge.billing_details ? charge.billing_details : {};
  return paymentIntent.receipt_email
    || billingDetails.email
    || billingDetails.name
    || "DTNT Pro Customer";
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, "utf8");
    if (current === content) {
      return false;
    }
  }

  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

function buildOrderRecord(session, licenseDocument) {
  return {
    status: "fulfilled",
    sessionId: session.id,
    licensedTo: getLicensedTo(session),
    activationUrl: `/Net-tools/licenses/${session.id}.json`,
    downloadUrl: config.downloadUrl,
    supportEmail: config.supportEmail,
    paymentStatus: session.payment_status,
    checkoutStatus: session.status,
    licenseKeyHint: licenseDocument.Payload.LicenseKeyHint,
    amountTotal: session.amount_total,
    currency: session.currency,
    createdAt: new Date(session.created * 1000).toISOString(),
    paymentLink: session.payment_link || null
  };
}

function buildPaymentIntentOrderRecord(paymentIntent, charge, licenseDocument) {
  return {
    status: "fulfilled",
    paymentIntentId: paymentIntent.id,
    licensedTo: getLicensedToFromPaymentIntent(paymentIntent, charge),
    activationUrl: `/Net-tools/licenses/${paymentIntent.id}.json`,
    downloadUrl: config.downloadUrl,
    supportEmail: config.supportEmail,
    paymentStatus: paymentIntent.status,
    checkoutStatus: "succeeded",
    licenseKeyHint: licenseDocument.Payload.LicenseKeyHint,
    amountTotal: paymentIntent.amount,
    currency: paymentIntent.currency,
    createdAt: new Date(paymentIntent.created * 1000).toISOString(),
    paymentLink: null
  };
}

async function main() {
  ensureDirectory(ordersDir);
  ensureDirectory(licensesDir);

  const sessions = await listCheckoutSessions();
  const paymentIntents = await listPaymentIntents();
  let changedFiles = 0;
  let matchedSessions = 0;
  let matchedPaymentIntents = 0;

  for (const session of sessions) {
    if (!await sessionMatches(session)) {
      continue;
    }

    matchedSessions += 1;
    const licensedTo = getLicensedTo(session);
    const issuedAt = new Date(session.created * 1000);
    const licenseDocument = createActivationDocument(config, session.id, licensedTo, issuedAt);
    const orderRecord = buildOrderRecord(session, licenseDocument);
    const orderPath = path.join(ordersDir, `${session.id}.json`);
    const licensePath = path.join(licensesDir, `${session.id}.json`);

    if (writeIfChanged(licensePath, `${JSON.stringify(licenseDocument, null, 2)}\n`)) {
      changedFiles += 1;
    }

    if (writeIfChanged(orderPath, `${JSON.stringify(orderRecord, null, 2)}\n`)) {
      changedFiles += 1;
    }
  }

  for (const paymentIntent of paymentIntents) {
    if (!await paymentIntentMatches(paymentIntent)) {
      continue;
    }

    matchedPaymentIntents += 1;
    const charge = await getCharge(paymentIntent.latest_charge);
    const licensedTo = getLicensedToFromPaymentIntent(paymentIntent, charge);
    const issuedAt = new Date(paymentIntent.created * 1000);
    const licenseDocument = createActivationDocument(config, paymentIntent.id, licensedTo, issuedAt);
    const orderRecord = buildPaymentIntentOrderRecord(paymentIntent, charge, licenseDocument);
    const orderPath = path.join(ordersDir, `${paymentIntent.id}.json`);
    const licensePath = path.join(licensesDir, `${paymentIntent.id}.json`);

    if (writeIfChanged(licensePath, `${JSON.stringify(licenseDocument, null, 2)}\n`)) {
      changedFiles += 1;
    }

    if (writeIfChanged(orderPath, `${JSON.stringify(orderRecord, null, 2)}\n`)) {
      changedFiles += 1;
    }
  }

  console.log(`Scanned ${sessions.length} checkout sessions.`);
  console.log(`Scanned ${paymentIntents.length} payment intents.`);
  console.log(`Matched ${matchedSessions} DTNT Pro session(s).`);
  console.log(`Matched ${matchedPaymentIntents} DTNT Pro payment intent(s).`);
  console.log(`Updated ${changedFiles} file(s).`);

  if (matchedSessions === 0 && matchedPaymentIntents === 0) {
    console.log(`No paid DTNT orders found yet for payment link ${config.paymentLinkId || "(not configured)"}.`);
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
