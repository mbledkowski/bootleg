import Olx from "./olx/index.js";
import { Category } from "./olx/categories";

export { Olx };

async function main() {
  const olx = new Olx("pl");
  const categories: Category = await olx.getCategories();

  console.log(categories)
  console.log(
    (await categories.findSub(["Elektronika", "Gry i Konsole", "Konsole", "PlayStation"]))?.getUrl()
  );
}

main();
