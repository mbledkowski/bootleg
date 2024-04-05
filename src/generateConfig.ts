import { PlaywrightCrawlerOptions, type PlaywrightCrawlingContext } from 'crawlee';
import os from 'os';

type resourceTypes = "document" | "stylesheet" | "image" | "media" | "font" | "script" | "texttrack" | "xhr" | "fetch" | "eventsource" | "websocket" | "manifest" | "other"

let EXCLUDED_RESOURCES: resourceTypes[] = [
  // "document",
  "stylesheet",
  "image",
  "media",
  "font",
  // "script",
  "texttrack", // https://developer.mozilla.org/en-US/docs/Web/API/TextTrack
  // "xhr",
  // "fetch",
  "eventsource",
  "websocket",
  "manifest",
  "other",
];

async function excludeResources(context: PlaywrightCrawlingContext) {
  await context.page.route('**/*', (route) => {
    return EXCLUDED_RESOURCES.includes(route.request().resourceType() as resourceTypes)
      ? route.abort()
      : route.continue()
  });
}

const CONFIG: PlaywrightCrawlerOptions | any = {
  preNavigationHooks: [excludeResources],
  browserPoolOptions: {
    useFingerprints: true,
    fingerprintOptions: {
      fingerprintGeneratorOptions: {
        browsers: [
          {
            name: "edge",
            minVersion: 96,
          },
          {
            name: "chrome",
            minVersion: 96,
          },
          {
            name: "firefox",
            minVersion: 94,
          },
          {
            name: "safari",
            minVersion: 15,
          },
        ],
        devices: ["desktop", "mobile"],
        operatingSystems: ["windows", "macos", "linux", "android", "ios"],
      },
    },
  },
  headless: true,
  maxRequestsPerMinute: 360,
  maxConcurrency: os.cpus().length,
  maxRequestRetries: 3,
}
export default function generateConfig(config?: PlaywrightCrawlerOptions | any, excludedResources?: resourceTypes[]) {
  if (excludedResources) {
    excludedResources = excludedResources;
  }
  if (config) {
    for (const key in config) {
      CONFIG[key] = config[key];
    }
  }
  return CONFIG;
}
