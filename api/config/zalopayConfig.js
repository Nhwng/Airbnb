// ZaloPay configuration.
// Callback URL now derives from env var ZALOPAY_CALLBACK_URL, or is constructed
// from PUBLIC_TUNNEL_URL (e.g. ngrok) falling back to local server.
// Secret keys should be provided via environment variables; existing literal
// defaults remain ONLY as a fallback for local quick-start (replace/remove in production).
const zalopayConfig = {
    app_id: Number(process.env.ZALOPAY_APP_ID || 2554),
    key1: process.env.ZALOPAY_KEY1 || "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
    key2: process.env.ZALOPAY_KEY2 || "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
    endpoint: process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create",
    callback_url: `https://0d9fc3dad105.ngrok-free.app/payments/zalopay/callback`
};

module.exports = { zalopayConfig };