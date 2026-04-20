const https = require("https");

const config = {
  stripeSecretKey: requireEnv("STRIPE_SECRET_KEY"),
  productName: process.env.PROPOKIT_PRODUCT_NAME || "PropoKit",
  productDescription:
    process.env.PROPOKIT_PRODUCT_DESCRIPTION ||
    "Proposal software by Denali Tech Inc. for creating client-ready proposals, managing products and services, and exporting professional proposal documents.",
  currency: (process.env.PROPOKIT_CURRENCY || "usd").toLowerCase(),
  starterAmount: Number(process.env.PROPOKIT_STARTER_AMOUNT || 2900),
  proAmount: Number(process.env.PROPOKIT_PRO_AMOUNT || 5900),
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function assertLiveStripeKey(secretKey) {
  if (!/^(sk|rk)_live_/i.test(secretKey)) {
    throw new Error("STRIPE_SECRET_KEY must be a live Stripe key.");
  }
}

function stripeRequest(method, requestPath, form = null) {
  const body = form ? new URLSearchParams(form).toString() : "";
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.stripe.com",
        path: requestPath,
        method,
        headers: {
          Authorization: `Bearer ${config.stripeSecretKey}`,
          "Stripe-Version": "2026-02-25.clover",
          ...(body
            ? {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(body),
              }
            : {}),
        },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const payload = text ? JSON.parse(text) : {};
          if (response.statusCode >= 400) {
            reject(
              new Error(
                payload.error && payload.error.message
                  ? payload.error.message
                  : `Stripe request failed with ${response.statusCode}.`
              )
            );
            return;
          }
          resolve(payload);
        });
      }
    );

    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}

async function listAll(requestPath) {
  const items = [];
  let startingAfter = "";
  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (startingAfter) params.set("starting_after", startingAfter);
    const separator = requestPath.includes("?") ? "&" : "?";
    const payload = await stripeRequest("GET", `${requestPath}${separator}${params.toString()}`);
    const pageItems = Array.isArray(payload.data) ? payload.data : [];
    items.push(...pageItems);
    if (!payload.has_more || pageItems.length === 0) break;
    startingAfter = pageItems[pageItems.length - 1].id;
  }
  return items;
}

async function getOrCreateProduct() {
  const products = await listAll("/v1/products");
  const existing = products.find((product) => product && product.name === config.productName);
  if (existing) return existing;

  return stripeRequest("POST", "/v1/products", {
    name: config.productName,
    description: config.productDescription,
    type: "service",
    "metadata[operator]": "Denali Tech Inc.",
    "metadata[product]": "PropoKit",
  });
}

function priceMatches(price, amount) {
  return (
    price &&
    price.active !== false &&
    price.currency === config.currency &&
    price.unit_amount === amount &&
    price.type === "recurring" &&
    price.recurring &&
    price.recurring.interval === "month" &&
    Number(price.recurring.interval_count || 1) === 1
  );
}

async function getOrCreateMonthlyPrice(product, label, amount) {
  const prices = await listAll(`/v1/prices?product=${encodeURIComponent(product.id)}&active=true`);
  const existing = prices.find((price) => priceMatches(price, amount));
  if (existing) return existing;

  return stripeRequest("POST", "/v1/prices", {
    product: product.id,
    currency: config.currency,
    unit_amount: String(amount),
    "recurring[interval]": "month",
    "recurring[interval_count]": "1",
    nickname: `PropoKit ${label} monthly`,
    "metadata[plan]": label.toLowerCase(),
    "metadata[product]": "PropoKit",
  });
}

async function main() {
  assertLiveStripeKey(config.stripeSecretKey);
  const product = await getOrCreateProduct();
  const starter = await getOrCreateMonthlyPrice(product, "Starter", config.starterAmount);
  const pro = await getOrCreateMonthlyPrice(product, "Pro", config.proAmount);
  const result = {
    productId: product.id,
    starterPriceId: starter.id,
    proPriceId: pro.id,
    currency: config.currency,
    starterAmount: config.starterAmount,
    proAmount: config.proAmount,
  };

  console.log(JSON.stringify(result, null, 2));

  if (process.env.GITHUB_OUTPUT) {
    const fs = require("fs");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `product_id=${product.id}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `starter_price_id=${starter.id}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `pro_price_id=${pro.id}\n`);
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
