import getCategories from './categories/main';

export type country = 'pl' | 'bg' | 'ro' | 'ua' | 'pt';

export default class Olx {
  constructor(private country: country) {
  }

  async getCategories() {
    return await getCategories(this.country);
  }
}
