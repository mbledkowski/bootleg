import playwright, {type Browser, BrowserContext, LaunchOptions, type Locator, Page} from "playwright";
import os from "os";
import { type country } from "../index";
import UserAgent from "user-agents";

const log = console;

export type WebEngines = "chromium" | "firefox" | "webkit";

type resourceTypes = "document" | "stylesheet" | "image" | "media" | "font" | "script" | "texttrack" | "xhr" | "fetch" | "eventsource" | "websocket" | "manifest" | "other"

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
  private webEngines: WebEngines[] = ["chromium", "firefox"];
  private browsers: Browser[] = [];
  public isInitialized = false;

  async init() {
    for (const webEngine of this.webEngines) {
      const browser: Browser = await playwright[webEngine].launch(OPTIONS)
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
  constructor(private name: string, private url: string) {
  }
  getName() {
    return this.name;
  }
  getUrl() {
    return this.url;
  }
  getSub() {
    return this.sub[Symbol.iterator];
  }
  setSub(sub: Category[]) {
    this.sub.push(...sub);
  }
}

const QUEUE: { url: string, label: "sitemap" | "category", data?: { superCategory: Category }, retry?: number }[] = [];

const CATEGORIES_DATA: Category[] = [];

async function sitemap(page: Page, url: string) {
  await page.route('**/*', (route) => {
    return EXCLUDED_RESOURCES.includes(route.request().resourceType() as resourceTypes)
      ? route.abort()
      : route.continue()
  })
  await page.goto(url);
  const title = await page.title();
  log.info(`[SITEMAP] ${title}: ${url}`);

  await page.waitForSelector('#hydrate-root', { timeout: 10000 })

  // Desktop version
  const content = page.locator('#mainContent');
  const topCategoryElements = await content.locator('div:has(> h1) > div').all()

  async function getSubCategories(categoryElement: Locator) {
    const subCategoryElements = await categoryElement.locator('> ul > li').all();
    const subCategories: Category[] = [];
    for (const subCategoryElement of subCategoryElements) {
      const link = subCategoryElement.locator('> div > a').first();
      const linkHref = await link.evaluate((e: HTMLAnchorElement) => e.href) || "";
      const subCategory = new Category(await link.textContent() ?? "", linkHref);
      const subSubCategoryElement = subCategoryElement.locator('> ul');

      if (await subSubCategoryElement.count() > 0) {
        subCategory.setSub(await getSubCategories(subSubCategoryElement));
      } else {
        QUEUE.push({
          url: linkHref,
          label: 'category',
          data: {
            superCategory: subCategory
          }
        })
      }
      subCategories.push(subCategory);
    }
    return subCategories;
  }

  for (const topCategoryElement of topCategoryElements) {
    const link = topCategoryElement.locator('a').first();
    const category = new Category(await link.textContent() ?? "", await link.evaluate((e: HTMLAnchorElement) => e.href) || "");
    category.setSub(await getSubCategories(topCategoryElement));
    CATEGORIES_DATA.push(category);
  }
}

async function category(page: Page, url: string, data: { superCategory: Category }) {
  await page.route('**/*', (route) => {
    return EXCLUDED_RESOURCES.includes(route.request().resourceType() as resourceTypes)
      ? route.abort()
      : route.continue()
  })
  await page.goto(url);
  const title = await page.title();
  log.info(`[CATEGORY] ${title}: ${url}`);

  await page.waitForSelector('#hydrate-root', { timeout: 10000 })

  const categories: Category[] = [];

  const content = page.locator('#mainContent');
  const categoryElements = await content.getByTestId('listing-filters-form').getByTestId('listing-filters').getByTestId('category-count-links').locator('li').all()

  for (const categoryElement of categoryElements) {
    const link = categoryElement.locator('a').first();
    const linkText = await link.evaluate(e => e.childNodes[0]?.textContent) || "";
    const linkHref = await link.evaluate((e: HTMLAnchorElement) => e.href) || "";
    const category = new Category(linkText, linkHref);

    QUEUE.push({
      url: linkHref,
      label: 'category',
      data: {
        superCategory: category
      }
    })
  }
  data.superCategory.setSub(categories);
}

export async function getCategories(country: country, options?: LaunchOptions) {
  if (options) {
    OPTIONS = options;
  }
  const cpus = os.cpus().length;
  const startUrls: { url: string, label: "sitemap" | "category" }[] = [{
    url: `https://www.olx.${country}/sitemap/`,
    label: 'sitemap',
  }];

  QUEUE.push(...startUrls)

  while (QUEUE.length > 0) {
    const processQueue: Promise<void>[] = [];
    const iterations = Math.min(QUEUE.length, cpus)
    for (let i = 0; i < iterations; i++) {
      await new Promise(resolve => setTimeout(resolve, 1200))

      const pageFactory = new PageFactory();
      const page = await pageFactory.get();

      let {url, label, data, retry} = QUEUE.shift()!;

      if (!retry) {
        retry = 0;
      }
      async function process() {
        try {
          switch (label) {
            case 'sitemap':
              await sitemap(page, url)
              break;
            case 'category':
              await category(page, url, data!)
              break;
          }
        } catch (error) {
          log.error(error);
          retry!++;
          if (retry! < 3) {
            QUEUE.push({url, label, data, retry})
          }
        } finally {
          pageFactory.kill();
        }
      }
      processQueue.push(process());
    }

    await Promise.all(processQueue);
    log.info(`[QUEUE] ${QUEUE.length} items left`);
  }
  await browsers.kill();
  console.log(CATEGORIES_DATA);
}
