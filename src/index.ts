import Olx from "./olx/index.js";
import { Category } from "./olx/categories";

export { Olx };

async function main() {
  const olx = new Olx("pl");
  const categories: Category = await olx.getCategories();

  console.log(categories)
  console.log(
    (
      await (
        await (
          await (
            await categories.findSub("Elektronika")
          )?.findSub("Gry i Konsole")
        )?.findSub("Konsole")
      )?.findSub("PlayStation")
    )?.getUrl()
  );
}

main();
