var keen = {
  enabled: process.env.KEEN_ENABLED,
  projectId: process.env.KEEN_PROJECT_ID,
  writeKey: process.env.KEEN_WRITE_KEY
};

var api = {
  clientId: process.env.CLIENT_ID,
  host: process.env.API_HOST,
  nameSpace: "api",
  version: "v1"
};

var raven = {
  url: process.env.SENTRY_URL
};

export { keen };
export { api };
export { raven };

export default {
  keen, api, raven
};
