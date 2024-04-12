import playwright, {
  type Browser,
  BrowserContext,
  LaunchOptions,
  type Locator,
  Page,
} from "playwright";
import { type country } from "../index.js";
import UserAgent from "user-agents";

const log = console;

export type WebEngines = "chromium" | "firefox" | "webkit";

type resourceTypes =
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

const EXCLUDED_RESOURCES: resourceTypes[] = [
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

class Browsers {
  private webEngines: WebEngines[] = ["chromium"];
  private browsers: Browser[] = [];
  public isInitialized = false;

  async init() {
    for (const webEngine of this.webEngines) {
      const browser: Browser = await playwright[webEngine].launch(OPTIONS);
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

const browsers = new Browsers();

class PageFactory {
  private context: BrowserContext | undefined;
  private page: Page | undefined;

  async get() {
    if (!browsers.isInitialized) {
      await browsers.init();
    }
    const browser = browsers.getRandom();
    const userAgent = new UserAgent({ deviceCategory: "desktop" }).toString();

    this.context = await browser.newContext({ userAgent });
    this.page = await this.context.newPage();

    return this.page;
  }

  async kill() {
    if (this.context) {
      await this.context.close();
    }
  }
}

export class Category {
  private sub: Category[] = [];
  private subLoaded = false;

  constructor(private name: string, private url: string) {
  }

  getName() {
    return this.name;
  }

  getUrl() {
    return this.url;
  }

  getSubs() {
    return this.sub[Symbol.iterator];
  }

  setSubs(sub: Category[]) {
    if (sub.length !== 0) {
      this.sub.push(...sub);
      this.subLoaded = true;
    }
  }

  async findSub(names: string[]): Promise<Category | null> {
    let result: Category = this;
    for (const name of names) {
      let found = false;
      if (!result.subLoaded) {
        await handleScraper(category, {
          url: result.getUrl(),
          data: { superCategory: result },
        });
      }
      for (const category of result.sub) {
        if (category.getName().toUpperCase() === name.toUpperCase()) {
          result = category;
          found = true;
        }
      }
      if (!found) {
        return null;
      }
    }
    return result;
  }
}

async function sitemap(page: Page, rootUrl: string) {
  const categories = new Category("root", rootUrl);
  const url = rootUrl + "sitemap/";
  await page.route("**/*", (route) => {
    return EXCLUDED_RESOURCES.includes(
      route.request().resourceType() as resourceTypes
    )
      ? route.abort()
      : route.continue();
  });
  await page.goto(url);
  const title = await page.title();
  log.info(`[SITEMAP] ${title}: ${url}`);

  await page.waitForSelector("#hydrate-root", { timeout: 10000 });

  const content = page.locator("#mainContent");

  async function getSubCategories(categoryElement: Locator, level: number) {
    const subCategoryElements = await categoryElement
      .locator("> ul > li")
      .all();
    if (subCategoryElements.length !== 0) {
      const subCategories: Category[] = [];
      const queue: Promise<void>[] = [];

      async function findSubForSubElement(element: Locator) {

        const link = element.locator("> div > a").first();
        const [linkHref, linkText] = await Promise.all([link.evaluate((e: HTMLAnchorElement) => e.href), await link.textContent()])
        if (linkHref && linkText) {
          const subCategory = new Category(
            linkText,
            linkHref
          );

          if (level < 2) {
            subCategory.setSubs(await getSubCategories(element, level + 1));
          }
          subCategories.push(subCategory);
        }
      }

      for (const subCategoryElement of subCategoryElements) {
        queue.push(findSubForSubElement(subCategoryElement));
      }
      await Promise.all(queue);
      return subCategories;
    }
    return [];
  }

  const queue: Promise<void>[] = [];

  async function findSubForElement(element: Locator) {

    const link = element.locator("a").first();
    const [linkHref, linkText] = await Promise.all([link.evaluate((e: HTMLAnchorElement) => e.href), await link.textContent()])
    if (linkHref && linkText) {
      const category = new Category(
        linkText,
        linkHref
      );
      category.setSubs(await getSubCategories(element, 1));
      categories.setSubs([category]);
    }
  }

  const topCategoryElements = await content
    .locator("div:has(> h1) > div")
    .all();

  for (const topCategoryElement of topCategoryElements) {
    queue.push(findSubForElement(topCategoryElement));
  }
  await Promise.all(queue);
  return categories;
}

async function category(
  page: Page,
  url: string,
  data: { superCategory: Category }
) {
  await page.route("**/*", (route) => {
    return EXCLUDED_RESOURCES.includes(
      route.request().resourceType() as resourceTypes
    )
      ? route.abort()
      : route.continue();
  });
  await page.goto(url);
  const title = await page.title();
  log.info(`[CATEGORY] ${title}: ${url}`);

  await page.waitForSelector("#hydrate-root", { timeout: 10000 });

  const categories: Category[] = [];

  const content = page.locator("#mainContent");
  const categoryElements = await content
    .getByTestId("listing-filters-form")
    .getByTestId("listing-filters")
    .getByTestId("category-count-links")
    .locator("li")
    .all();

  for (const categoryElement of categoryElements) {
    const link = categoryElement.locator("a").first();
    const linkText = await link.evaluate((e) => e.childNodes[0]?.textContent);
    const linkHref = await link.evaluate((e: HTMLAnchorElement) => e.href);
    if (linkHref && linkText) {
      const category = new Category(linkText, linkHref);
      categories.push(category);
    }
  }
  data.superCategory.setSubs(categories);
}

async function handleScraper<Data, Return>(
  func: (page: Page, url: string, data: Data) => Promise<Return>,
  args: { url: string; data: Data },
  retries = 3
) {
  let result = null;
  let retry = 0;
  let shouldRetry = true;
  while (shouldRetry && retry < retries) {
    shouldRetry = false;
    const pageFactory = new PageFactory();
    const page = await pageFactory.get();
    try {
      result = await func(page, args.url, args.data);
    } catch (error) {
      log.error(error);
      retry++;
      shouldRetry = true;
      result = null;
    } finally {
      pageFactory.kill();
    }
  }
  return result;
}

export async function getCategories(country: country, options?: LaunchOptions): Promise<Category> {
  if (options) {
    OPTIONS = options;
  }
  const mainUrl = `https://www.olx.${country}/`;

  browsers.kill();
  return (await handleScraper<undefined, Category>(sitemap, { url: mainUrl, data: undefined }))!;
}
