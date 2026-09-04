import { createApp } from "./app";

const { app, config } = await createApp();

console.log(`Fluxoid server listening on http://localhost:${config.port}`);

export default {
  port: config.port,
  fetch: app.fetch,
};
