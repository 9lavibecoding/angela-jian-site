import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

function generateCheckMacValue(params: Record<string, string>, hashKey: string, hashIV: string): string {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.')
    .replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(')
    .replace(/%29/g, ')').replace(/%20/g, '+');
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

function generateToken(tradeNo: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(tradeNo).digest('hex').substring(0, 32);
}

// 一對一諮詢商品：依 MerchantTradeNo 前綴判斷是哪個服務。
// schedulingUrl 目前是佔位值，Cal.com 連結到位後在這裡替換。
const CONSULTING_INFO: Record<string, { label: string; schedulingUrl: string }> = {
  CTRN: { label: '企業內訓／顧問諮詢', schedulingUrl: '#' },
  CRES: { label: '履歷／作品集健檢', schedulingUrl: '#' },
  CCAR: { label: '職涯諮詢／轉職陪跑', schedulingUrl: '#' },
};

// 綠界 OrderResultURL 接收端
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hashKey = process.env.ECPAY_HASH_KEY || '';
  const hashIV = process.env.ECPAY_HASH_IV || '';
  const body = req.body || {};
  const tradeNo = (req.query.trade_no as string) || body.MerchantTradeNo || '';
  const rtnCode = body.RtnCode || '';

  console.log('ECPay return:', { tradeNo, rtnCode, body });

  let macValid = false;

  if (body.CheckMacValue && hashKey && hashIV) {
    const receivedMac = body.CheckMacValue;
    const paramsToVerify: Record<string, string> = {};
    for (const key of Object.keys(body)) {
      if (key !== 'CheckMacValue') paramsToVerify[key] = body[key];
    }
    const computedMac = generateCheckMacValue(paramsToVerify, hashKey, hashIV);
    macValid = computedMac === receivedMac;
  }

  const verified = macValid && rtnCode === '1';

  // ATM／超商「取號成功」：綠界已配發繳費資訊，但客人還沒真的付錢。
  // 這裡絕對不能發開通 token —— token 等同權限，付款前發出去就是免費開通。
  const vAccount = String(body.vAccount || '');
  const paymentNo = String(body.PaymentNo || '');
  const barcode1 = String(body.Barcode1 || '');
  if (macValid && !verified && (vAccount || paymentNo || barcode1)) {
    const amount = String(body.TradeAmt || '199');
    const expire = String(body.ExpireDate || '');
    const payInfo = vAccount
      ? `<div class="row"><span>銀行代碼</span><b>${String(body.BankCode || '')}</b></div>
         <div class="row"><span>虛擬帳號</span><b class="sel">${vAccount}</b></div>`
      : paymentNo
        ? `<div class="row"><span>繳費代碼</span><b class="sel">${paymentNo}</b></div>`
        : `<div class="row"><span>條碼</span><b class="sel">${barcode1} ${String(body.Barcode2 || '')} ${String(body.Barcode3 || '')}</b></div>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>繳費資訊</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAF6EF;font-family:'Inter','Noto Sans TC',sans-serif;padding:1.5rem}
.card{background:#fff;border-radius:1.25rem;border:1px solid #E0D5C5;padding:2.5rem;max-width:460px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
.icon{font-size:3rem;margin-bottom:1rem;text-align:center}
h1{font-size:1.5rem;font-weight:700;color:#1a1814;margin-bottom:0.5rem;text-align:center}
.sub{font-size:0.875rem;color:#78716C;margin-bottom:1.5rem;line-height:1.6;text-align:center}
.box{background:#FAF6EF;border:2px dashed #E0D5C5;border-radius:0.75rem;padding:1rem 1.25rem;margin-bottom:1.25rem}
.row{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:0.4rem 0;font-size:0.875rem;color:#78716C}
.row b{color:#1a1814;font-weight:700;letter-spacing:0.03em}
.sel{user-select:all}
.steps{background:#FFFBF2;border:1px solid #E8D48B;border-radius:0.75rem;padding:1rem 1.25rem;margin-bottom:1.5rem}
.steps h2{font-size:0.875rem;font-weight:700;color:#1a1814;margin-bottom:0.5rem}
.steps ol{margin:0;padding-left:1.1rem}
.steps li{font-size:0.8125rem;color:#57534E;line-height:1.7}
.btn{display:block;text-align:center;padding:0.875rem 2rem;background:linear-gradient(135deg,#D4B86A,#C5A55A,#E8D48B,#C5A55A,#A8893E);color:#fff;font-weight:700;border-radius:999px;text-decoration:none;font-size:0.9rem}
.note{font-size:0.75rem;color:#78716C;margin-top:1rem;text-align:center;line-height:1.6}
</style></head>
<body>
<div class="card">
  <div class="icon">&#x1F3E7;</div>
  <h1>繳費資訊已產生</h1>
  <p class="sub">請於期限內完成轉帳，款項確認後即可開通題庫。</p>
  <div class="box">
    ${payInfo}
    <div class="row"><span>金額</span><b>NT$${amount}</b></div>
    ${expire ? `<div class="row"><span>繳費期限</span><b>${expire}</b></div>` : ''}
    <div class="row"><span>訂單編號</span><b class="sel">${tradeNo}</b></div>
  </div>
  <div class="steps">
    <h2>轉帳完成後這樣開通</h2>
    <ol>
      <li>回到 <b>aipm-insider.com/exam/app</b></li>
      <li>用你結帳時填寫的信箱所屬的 Google 帳號登入，系統會自動開通</li>
      <li>若沒有自動開通，在該頁輸入上方的<b>訂單編號</b>即可手動開通</li>
    </ol>
  </div>
  <a class="btn" href="/exam/app">前往題庫頁面</a>
  <p class="note">請記下訂單編號 <b class="sel">${tradeNo}</b>，開通時可能會用到。<br>款項通常在轉帳後數分鐘內確認。</p>
</div>
</body></html>`);
  }

  const token = verified ? generateToken(tradeNo, hashKey) : '';
  const appUrl = `/exam/app?trade_no=${tradeNo}` + (token ? `&token=${token}` : '');
  const consultingInfo = CONSULTING_INFO[tradeNo.substring(0, 4)];

  // 付款成功：顯示訂單編號提醒頁，然後自動跳轉
  // 付款失敗：直接跳回銷售頁
  if (!verified) {
    const failRedirect = consultingInfo ? '/consulting' : '/exam/';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>付款未完成</title></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#FAF6EF;">
<p>付款未完成，正在跳轉...</p>
<script>window.location.replace("${failRedirect}");</script>
</body></html>`);
  }

  if (consultingInfo) {
    const hasScheduling = consultingInfo.schedulingUrl !== '#';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>付款成功</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAF6EF;font-family:'Inter','Noto Sans TC',sans-serif;padding:1.5rem}
.card{background:#fff;border-radius:1.25rem;border:1px solid #E0D5C5;padding:2.5rem;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
.icon{font-size:3rem;margin-bottom:1rem}
h1{font-size:1.5rem;font-weight:700;color:#1a1814;margin-bottom:0.5rem}
.sub{font-size:0.875rem;color:#78716C;margin-bottom:1.5rem;line-height:1.6}
.btn{display:inline-block;padding:0.875rem 2.5rem;background:linear-gradient(135deg,#D4B86A,#C5A55A,#E8D48B,#C5A55A,#A8893E);color:#fff;font-weight:700;border-radius:999px;text-decoration:none;font-size:0.9rem;transition:opacity 0.2s}
.btn:hover{opacity:0.9}
</style></head>
<body>
<div class="card">
  <div class="icon">&#x2705;</div>
  <h1>付款成功！</h1>
  <p class="sub">你已完成「${consultingInfo.label}」的付款。</p>
  <p style="font-size:0.75rem;color:#78716C;margin-bottom:1.5rem;">訂單編號：${tradeNo}</p>
  ${hasScheduling
    ? `<p class="sub">接下來請選擇你方便的諮詢時間：</p><a class="btn" href="${consultingInfo.schedulingUrl}" target="_blank" rel="noopener noreferrer">選擇諮詢時間</a>`
    : `<p class="sub">我們會盡快主動聯繫你，安排諮詢時間。</p><a class="btn" href="/consulting">回到諮詢頁面</a>`}
</div>
</body></html>`);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>付款成功</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAF6EF;font-family:'Inter','Noto Sans TC',sans-serif;padding:1.5rem}
.card{background:#fff;border-radius:1.25rem;border:1px solid #E0D5C5;padding:2.5rem;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
.icon{font-size:3rem;margin-bottom:1rem}
h1{font-size:1.5rem;font-weight:700;color:#1a1814;margin-bottom:0.5rem}
.sub{font-size:0.875rem;color:#78716C;margin-bottom:1.5rem;line-height:1.6}
.order-box{background:#FAF6EF;border:2px dashed #E0D5C5;border-radius:0.75rem;padding:1rem;margin-bottom:0.75rem}
.order-label{font-size:0.75rem;color:#78716C;margin-bottom:0.25rem}
.order-no{font-size:1.1rem;font-weight:700;color:#1a1814;letter-spacing:0.05em;user-select:all}
.copy-btn{font-size:0.75rem;color:#C5A55A;cursor:pointer;border:none;background:none;font-weight:600;margin-bottom:1.5rem;text-decoration:underline}
.warn{font-size:0.75rem;color:#C5A55A;margin-bottom:1.5rem;line-height:1.5}
.btn{display:inline-block;padding:0.875rem 2.5rem;background:linear-gradient(135deg,#D4B86A,#C5A55A,#E8D48B,#C5A55A,#A8893E);color:#fff;font-weight:700;border-radius:999px;text-decoration:none;font-size:0.9rem;transition:opacity 0.2s}
.btn:hover{opacity:0.9}
.countdown{font-size:0.75rem;color:#78716C;margin-top:1rem}
</style></head>
<body>
<div class="card">
  <div class="icon">&#x2705;</div>
  <h1>付款成功！</h1>
  <p class="sub">你的 iPAS AI 題庫已解鎖。購買紀錄已綁定你的 Google 帳號，在任何裝置登入即可使用。</p>
  <p style="font-size:0.75rem;color:#78716C;margin-bottom:1.5rem;">訂單編號：${tradeNo}</p>
  <a class="btn" href="${appUrl}">進入題庫開始練習</a>
  <p class="countdown" id="cd">15 秒後自動跳轉...</p>
</div>
<script>
var s=15,el=document.getElementById('cd');
var t=setInterval(function(){s--;if(s<=0){clearInterval(t);window.location.href="${appUrl}"}else{el.textContent=s+' 秒後自動跳轉...'}},1000);
</script>
</body></html>`);
}
