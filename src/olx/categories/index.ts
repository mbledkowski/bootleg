import {
  type LaunchOptions,
  type Locator,
  type Page,
} from "playwright";
import { type country } from "../index.js";
import { getPageFactory, type webEngine, type resourceTypes, type PageFactory } from "../../page.js";

const log = console;

let WEB_ENGINES: webEngine[] = [];
let EXCLUDED_RESOURCES: resourceTypes[] = [];
let OPTIONS: LaunchOptions = {};

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
    const { pageFactory, browsers } = await getPageFactory(WEB_ENGINES, EXCLUDED_RESOURCES, OPTIONS);
    let result: Category = this;
    for (const name of names) {
      let found = false;
      if (!result.subLoaded) {
        await handleScraper(pageFactory, category, {
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
    browsers.kill();
    return result;
  }
}

async function sitemap(page: Page, rootUrl: string) {
  const categories = new Category("root", rootUrl);
  const url = rootUrl + "sitemap/";
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
  pageFactory: PageFactory,
  func: (page: Page, url: string, data: Data) => Promise<Return>,
  args: { url: string; data: Data },
  retries = 3
) {
  let result = null;
  let retry = 0;
  let shouldRetry = true;
  while (shouldRetry && retry < retries) {
    shouldRetry = false;
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

WEB_ENGINES = ["chromium"];

EXCLUDED_RESOURCES = [
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

export async function getRootCategory(country: country, options?: LaunchOptions): Promise<Category> {
  if (options) {
    OPTIONS = options
  }

  const { pageFactory, browsers } = await getPageFactory(WEB_ENGINES, EXCLUDED_RESOURCES, OPTIONS);

  const mainUrl = `https://www.olx.${country}/`;

  const category = (await handleScraper<undefined, Category>(pageFactory, sitemap, { url: mainUrl, data: undefined }))!;
  browsers.kill();
  return category;
}

export async function getCategory(names: string[], country: country, options?: LaunchOptions): Promise<Category> {
  const rootCategory = await getRootCategory(country, options);

  const category = (await rootCategory.findSub(names));

  if (category) {
    return category;
  }
  throw new Error("Category not found");
}
