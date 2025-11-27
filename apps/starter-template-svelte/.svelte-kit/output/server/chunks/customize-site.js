const DEV = typeof window !== "undefined" && window.location.hostname.includes("localhost"), PUBLIC_DOMAIN = DEV ? "http://localhost:5173" : "https://starterdocs.com", PUBLIC_GOOGLE_CLIENT_ID = "your-google-client-id-here", APP_NAME = "Starter Docs", APP_SLOGAN = "Svelte Starter Full Stack App with Docs and API", APP_EMAIL = "support@" + PUBLIC_DOMAIN.split("//")[1], GOOGLE_ANALYTICS = "your-google-analytics-id", LAST_REVISED_DATE = "January 1, 2025";
export {
  APP_NAME as A,
  GOOGLE_ANALYTICS as G,
  LAST_REVISED_DATE as L,
  PUBLIC_DOMAIN as P,
  PUBLIC_GOOGLE_CLIENT_ID as a,
  APP_SLOGAN as b,
  APP_EMAIL as c
};
