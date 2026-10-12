// 題庫商品的價格與品名，直接從 api/create-order.ts（真正跟客人收錢的地方）取出，
// 與 scripts/check-build.mjs 的價格比對同一個來源，前端不另寫一份數字。給 GA purchase 事件用。
// 抓不到就讓 build 失敗，避免送出錯誤營收。
import createOrderSrc from '../../api/create-order.ts?raw';

const price = Number(createOrderSrc.match(/TotalAmount:[^\n]*?'(\d+)'/)?.[1]);
const itemName = createOrderSrc.match(/ItemName:[^\n]*?:\s*'([^']+)'/)?.[1] || '';
if (!price || !itemName) {
  throw new Error('src/lib/exam-product.ts: 無法從 api/create-order.ts 取得題庫價格或品名');
}

export const EXAM_PRICE = price;
export const EXAM_ITEM_NAME = itemName;
