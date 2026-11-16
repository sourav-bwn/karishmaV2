import { createApp, configuration } from '../server.mjs';
// The deployed site defaults to an honest disconnected state. It cannot use
// a visitor's laptop localhost or borrow credentials from the original app.
const config = configuration({ ...process.env, AI_MODE: process.env.AI_MODE || 'openai' });
config.timeoutMs = 55000;
const app = createApp({ config });
export default function handler(req, res) {
  const route = req.query?.route;
  if (route) req.url = '/api/' + (Array.isArray(route) ? route.join('/') : route);
  return new Promise(resolve => { res.once('finish', resolve); res.once('close', resolve); app.emit('request', req, res); });
}
