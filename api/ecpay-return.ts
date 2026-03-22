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

// 綠界 OrderResultURL 接收端
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hashKey = process.env.ECPAY_HASH_KEY || '';
  const hashIV = process.env.ECPAY_HASH_IV || '';
  const body = req.body || {};
  const tradeNo = (req.query.trade_no as string) || body.MerchantTradeNo || '';
  const rtnCode = body.RtnCode || '';

  console.log('ECPay return:', { tradeNo, rtnCode, body });

  let verified = false;

  if (body.CheckMacValue && hashKey && hashIV) {
    const receivedMac = body.CheckMacValue;
    const paramsToVerify: Record<string, string> = {};
    for (const key of Object.keys(body)) {
      if (key !== 'CheckMacValue') paramsToVerify[key] = body[key];
    }
    const computedMac = generateCheckMacValue(paramsToVerify, hashKey, hashIV);
    if (computedMac === receivedMac && rtnCode === '1') {
      verified = true;
    }
  }

  const token = verified ? generateToken(tradeNo, hashKey) : '';
  const appUrl = `/exam/app?trade_no=${tradeNo}` + (token ? `&token=${token}` : '');

  // 付款成功：顯示訂單編號提醒頁，然後自動跳轉
  // 付款失敗：直接跳回銷售頁
  if (!verified) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>付款未完成</title></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#FAF6EF;">
<p>付款未完成，正在跳轉...</p>
<script>window.location.replace("/exam/");</script>
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
