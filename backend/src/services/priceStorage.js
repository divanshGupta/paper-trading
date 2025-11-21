import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "src/storage/prices.json");

export function loadPrices() {
  try {
    if (!fs.existsSync(FILE_PATH)) return null;
    const data = fs.readFileSync(FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading PRICES file:", err);
    return null;
  }
}

export function savePrices(prices) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(prices, null, 2));
  } catch (err) {
    console.error("Error writing PRICES file:", err);
  }
}
