import {getCategories} from './categories';
import {LaunchOptions} from "playwright";

export type country = 'pl' | 'bg' | 'ro' | 'ua' | 'pt';

export default class Olx {
  private options: LaunchOptions = {
    headless: true,
  }
  constructor(private country: country) {
  }

  async getCategories() {
    return await getCategories(this.country, this.options);
  }
}
