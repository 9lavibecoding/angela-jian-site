// GA4 載入與共用埋點函式（inline script 字串）。
// - 只在正式站（aipm-insider.com / www.aipm-insider.com）載入 gtag.js 並 config，
//   preview（*.vercel.app）與 localhost 不送資料，只把事件 console.debug 出來方便驗證。
// - 各頁一律呼叫 window.aipmTrack(name, params)，內部錯誤全部吞掉，埋點絕不能弄壞頁面。
// 使用者：src/layouts/Base.astro、src/pages/exam/print.astro。
// api/ecpay-return.ts 是 Vercel function，現有 api/*.ts 都不 import 本地模組，因此在該檔內放一份相同字串；
// scripts/check-build.mjs 會比對兩份是否一致。這個字串內不要出現反引號、錢號大括號或反斜線。
export const GA_ID = 'G-XY1PQ9JQVG';

export const GA_INLINE = "(function(){var ID='G-XY1PQ9JQVG';window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};var h=location.hostname;var prod=h==='aipm-insider.com'||h==='www.aipm-insider.com';if(prod){try{var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(s);window.gtag('js',new Date());window.gtag('config',ID);}catch(e){}}window.aipmTrack=function(name,params){try{params=params||{};if(!prod){console.debug('[ga]',name,params);}window.gtag('event',name,params);}catch(e){}};})();";
