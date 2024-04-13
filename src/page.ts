import playwright, { type Browser, type Page, type BrowserContext, type LaunchOptions } from "playwright";
import UserAgent from "user-agents";

export type webEngine = "chromium" | "firefox" | "webkit";

export type resourceTypes =
  | "document"
  | "stylesheet"
  | "image"
  | "media"
  | "font"
  | "script"
  | "texttrack"
  | "xhr"
  | "fetch"
  | "eventsource"
  | "websocket"
  | "manifest"
  | "other";

let WEB_ENGINES: webEngine[] = ["chromium", "firefox"];

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

let OPTIONS: LaunchOptions = {};

export class Browsers {
  private webEngines: webEngine[] = ["chromium"];
  private options: LaunchOptions = {};
  private browsers: Browser[] = [];
  public isInitialized = false;

  constructor() {
    this.webEngines = WEB_ENGINES;
    this.options = OPTIONS;
  }

  async init() {
    for (const webEngine of this.webEngines) {
      const browser: Browser = await playwright[webEngine].launch(this.options);
      this.browsers.push(browser);
    }
    this.isInitialized = true;
  }

  getRandom() {
    const randomIndex = Math.floor(Math.random() * this.browsers.length);
    const browser = this.browsers[randomIndex];
    if (browser !== undefined) {
      return browser;
    }
    throw new Error("No browser available");
  }

  async kill() {
    for (const browser of this.browsers) {
      await browser.close();
    }
  }
}


export class PageFactory {
  private context: BrowserContext | undefined;
  private page: Page | undefined;

  constructor(private browsers: Browsers) {
  }

  async get() {
    if (!this.browsers.isInitialized) {
      await this.browsers.init();
    }
    const browser = this.browsers.getRandom();
    const userAgent = new UserAgent({ deviceCategory: "desktop" }).toString();

    this.context = await browser.newContext({ userAgent });
    this.page = await this.context.newPage();

    await this.page.route("**/*", (route) => {
      return EXCLUDED_RESOURCES.includes(
        route.request().resourceType() as resourceTypes
      )
        ? route.abort()
        : route.continue();
    });
    return this.page;
  }

  async kill() {
    if (this.context) {
      await this.context.close();
    }
  }
}

export async function getPageFactory(engines: webEngine[], excludedResources: resourceTypes[], options: LaunchOptions) {
  WEB_ENGINES = engines;
  EXCLUDED_RESOURCES = excludedResources;
  OPTIONS = options;
  const browsers = new Browsers();
  const pageFactory = new PageFactory(browsers);
  return { pageFactory, browsers }
}
