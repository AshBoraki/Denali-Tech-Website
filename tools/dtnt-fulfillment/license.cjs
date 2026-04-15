const crypto = require("crypto");

function pad2(value) {
  return String(value).padStart(2, "0");
}

function pad7FromMilliseconds(milliseconds) {
  return `${String(milliseconds).padStart(3, "0")}0000`;
}

function formatDateTimeOffset(date) {
  return [
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`,
    "T",
    `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`,
    ".",
    pad7FromMilliseconds(date.getUTCMilliseconds()),
    "+00:00"
  ].join("");
}

function escapeSystemTextJson(json) {
  return json
    .replace(/\+/g, "\\u002B")
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027");
}

function serializePayload(payload) {
  return escapeSystemTextJson(JSON.stringify({
    ProductCode: payload.ProductCode,
    Edition: payload.Edition,
    LicensedTo: payload.LicensedTo,
    IssuedAt: payload.IssuedAt,
    ExpiresAt: payload.ExpiresAt,
    LicenseKeyHint: payload.LicenseKeyHint
  }));
}

function getLicenseHint(sessionId) {
  const collapsed = String(sessionId || "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
  const tail = collapsed.length > 12 ? collapsed.slice(-12) : collapsed;
  return `DTNT-PRO-${tail}`;
}

function createActivationDocument(config, checkoutSessionId, licensedTo, issuedAt) {
  const payload = {
    ProductCode: config.productCode,
    Edition: 1,
    LicensedTo: licensedTo,
    IssuedAt: formatDateTimeOffset(issuedAt),
    ExpiresAt: null,
    LicenseKeyHint: getLicenseHint(checkoutSessionId)
  };

  const payloadJson = serializePayload(payload);
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(Buffer.from(payloadJson, "utf8"));
  signer.end();

  const signature = signer.sign({
    key: config.activationPrivateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }).toString("base64");

  return {
    Payload: payload,
    Signature: signature
  };
}

module.exports = {
  createActivationDocument,
  getLicenseHint
};
