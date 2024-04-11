import { Category, getCategories } from './categories';
import { LaunchOptions } from "playwright";

export type country = 'pl' | 'bg' | 'ro' | 'ua' | 'pt';

export default class Olx {
  private options: LaunchOptions = {
    headless: false,
    timeout: 100000,
  }
  constructor(private country: country) {
  }

  async getCategories(): Promise<Category> {
    return await getCategories(this.country, this.options);
  }
}
