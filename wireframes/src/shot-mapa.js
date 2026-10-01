const path=require('path');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1900,height:900},deviceScaleFactor:1.5});
await p.goto('file://'+path.join(__dirname,'mapa.html'));await p.screenshot({path:path.join(__dirname,'..','mapa-navegacion.png'),fullPage:true});await b.close();})();
