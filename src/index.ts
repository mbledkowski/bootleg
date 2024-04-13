import Olx from "./olx/index.js";
import { Category } from "./olx/categories";

export { Olx };

async function main() {
  const olx = new Olx("pl");
  const category: Category = await olx.getCategory(["Elektronika", "Gry i Konsole", "Konsole", "PlayStation"]);

  console.log(category)
  console.log(category.getUrl())

  const offers = await olx.getOffers("psp", category);

  console.log(offers)
}

main();
