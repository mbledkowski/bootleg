import { Category, getCategory, getRootCategory } from './categories';
import { getOffers } from './offers';
import { LaunchOptions } from "playwright";

export type country = 'pl' | 'bg' | 'ro' | 'ua' | 'pt';

export default class Olx {
  private options: LaunchOptions = {
    headless: false,
    timeout: 100000,
  }
  constructor(private country: country) {
  }

  async getRootCategory(): Promise<Category> {
    return await getRootCategory(this.country, this.options);
  }

  async getCategory(names: string[]): Promise<Category> {
    return await getCategory(names, this.country, this.options);
  }

  async getOffers(query: string, category?: Category) {
    if (category) {
      return await getOffers(query, category, this.options);
    } else {
      return await getOffers(query, this.country, this.options);
    }
  }
}
