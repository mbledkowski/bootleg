import { PlaywrightCrawler, Dataset, Configuration } from 'crawlee';
import playwrightConfig from '../config';
import { router } from './routes';
import { country } from '..';

export default async function getCategories(country: country) {
  const startUrls = [`https://www.olx.${country}/sitemap/`];

  // const config = new Configuration({
  //   defaultDatasetId: `categories_olx_${country}`,
  // })

  const crawler = new PlaywrightCrawler({
    requestHandler: router,
    ...playwrightConfig
  });
  // }, config);

  await crawler.run(startUrls);
}
