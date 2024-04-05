import { createPlaywrightRouter } from 'crawlee';
import { type Locator } from "playwright";

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

export const categoriesData: Category[] = [];

export const router = createPlaywrightRouter();

// Sitemap page
router.addDefaultHandler(async ({ crawler, request, page, log }) => {
  const title = await page.title();
  const url = request.loadedUrl;
  log.info(`[SITEMAP] ${title}: ${url}`);

  await page.waitForSelector('#hydrate-root', { timeout: 10000 })

  if (await page.locator('main').count() > 0) {
    // Mobile version
    const content = page.locator('main');
  } else {
    // Desktop version
    const content = page.locator('#mainContent');
    const topCategoryElements = await content.locator('div:has(> h1) > div').all()

    async function getSubCategories(categoryElement: Locator) {
      const subCategoryElements = await categoryElement.locator('> ul > li').all();
      const subCategories: Category[] = [];
      for (const subCategoryElement of subCategoryElements) {
        const link = subCategoryElement.locator('> div > a').first();
        const linkHref = await link.evaluate((e: HTMLAnchorElement) => e.href) || "";
        const subCategory = new Category(await link.textContent() || "", linkHref);
        const subSubCategoryElement = subCategoryElement.locator('> ul');

        if (await subSubCategoryElement.count() > 0) {
          subCategory.setSub(await getSubCategories(subSubCategoryElement));
        } else {
          console.log(subCategory)
          await crawler.addRequests([{
            url: linkHref,
            label: 'category',
            userData: {
              data: {
                superCategory: subCategory
              }
            }
          }])
        }
        subCategories.push(subCategory);
      }
      return subCategories;
    }

    for (const topCategoryElement of topCategoryElements) {
      const link = topCategoryElement.locator('a').first();
      const category = new Category(await link.textContent() || "", await link.evaluate((e: HTMLAnchorElement) => e.href) || "");
      category.setSub(await getSubCategories(topCategoryElement));
      categoriesData.push(category);
    }
  }

  console.log(categoriesData)
});

router.addHandler('category', async ({ crawler, request, page, log }) => {
  const title = await page.title();
  const url = request.loadedUrl;
  log.info(`[CATEGORY] ${title}: ${url}`);

  const { data } = request.userData;

  const categories: Category[] = [];

  if (await page.locator('main').count() > 0) {
    // Mobile version
    const content = page.locator('main');
  } else {
    // Desktop version
    const content = page.locator('#mainContent');
    const categoryElements = await content.getByTestId('listing-filters-form').getByTestId('listing-filters').getByTestId('category-count-links').locator('li').all()

    for (const categoryElement of categoryElements) {
      const link = categoryElement.locator('a').first();
      const linkText = await link.evaluate(e => e.childNodes[0]?.textContent) || "";
      const linkHref = await link.evaluate((e: HTMLAnchorElement) => e.href) || "";
      const category = new Category(linkText, linkHref);

      await crawler.addRequests([{
        url: linkHref,
        label: 'category',
        userData: {
          data: {
            superCategory: category
          }
        }
      }])
      categories.push(category);
    }
  }
  console.log(data.superCategory)
  data.superCategory.setSub(categories);
});
