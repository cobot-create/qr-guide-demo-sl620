// データソース設定:
// 実運用ではここに Google スプレッドシートの「ウェブに公開」CSV URLを入れる。
// 例: https://docs.google.com/spreadsheets/d/e/【公開ID】/pub?gid=0&single=true&output=csv
// このデモでは、ヘッドレス実行環境(ブラウザ操作不可)から新規Googleスプレッドシートを
// 作成できないため、同一リポジトリ内の data.csv を「同等の外部シート」として使用する。
// パーサーはGoogleスプレッドシートのCSV出力(カンマ区切り+引用符)にもそのまま対応する。
const DATA_URL = "data.csv";

let currentLang = "ja";
let rows = [];

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.length > 0);
  const parseLine = (line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { cur += c; }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { cells.push(cur); cur = ""; }
        else cur += c;
      }
    }
    cells.push(cur);
    return cells;
  };
  const header = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const obj = {};
    header.forEach((h, i) => { obj[h] = (cells[i] || "").trim(); });
    return obj;
  });
}

function groupByCategory(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = item.category_ja;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function render() {
  const menuEl = document.getElementById("menu");
  const navEl = document.getElementById("categoryNav");
  const grouped = groupByCategory(rows);

  navEl.innerHTML = "";
  menuEl.innerHTML = "";

  let i = 0;
  for (const [catJa, items] of grouped) {
    const catEn = items[0].category_en;
    const catLabel = currentLang === "en" && catEn ? catEn : catJa;
    const anchorId = "cat-" + i++;

    const navLink = document.createElement("a");
    navLink.href = "#" + anchorId;
    navLink.textContent = catLabel;
    navEl.appendChild(navLink);

    const block = document.createElement("section");
    block.className = "category-block";
    block.id = anchorId;

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = catLabel;
    block.appendChild(title);

    items.forEach((item) => {
      const nameJa = item.name_ja;
      const nameEn = item.name_en;
      const descJa = item.desc_ja;
      const descEn = item.desc_en;
      const allergenJa = item.allergen_ja;
      const allergenEn = item.allergen_en;

      const name = currentLang === "en" && nameEn ? nameEn : nameJa;
      const desc = currentLang === "en" ? (descEn || descJa) : descJa;
      const allergen = currentLang === "en" && allergenEn ? allergenEn : allergenJa;
      const allergenLabel = currentLang === "en" ? "Allergens" : "アレルゲン";

      const card = document.createElement("article");
      card.className = "item-card";
      card.innerHTML = `
        <div class="item-main">
          <p class="item-name"></p>
          <p class="item-desc"></p>
          <span class="item-allergen"></span>
        </div>
        <div class="item-price"></div>
      `;
      card.querySelector(".item-name").textContent = name;
      card.querySelector(".item-desc").textContent = desc;
      card.querySelector(".item-allergen").textContent = `${allergenLabel}: ${allergen}`;
      card.querySelector(".item-price").textContent = "¥" + Number(item.price).toLocaleString();
      block.appendChild(card);
    });

    menuEl.appendChild(block);
  }

  document.getElementById("shopTagline").textContent = currentLang === "en" ? "MENU" : "MENU / メニュー";
  document.getElementById("langToggle").textContent = currentLang === "en" ? "JA" : "EN";
  document.getElementById("updateNote").textContent = currentLang === "en"
    ? "Prices and contents are subject to change without notice."
    : "価格・内容は予告なく変更する場合があります。";
}

async function load() {
  const res = await fetch(DATA_URL + "?t=" + Date.now());
  const text = await res.text();
  rows = parseCSV(text);
  render();
}

document.getElementById("langToggle").addEventListener("click", () => {
  currentLang = currentLang === "ja" ? "en" : "ja";
  render();
});

load().catch((err) => {
  document.getElementById("loadingMsg").textContent = "読み込みに失敗しました: " + err.message;
});
