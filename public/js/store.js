/* Penyimpanan aman: jika localStorage diblokir browser, data disimpan di memori selama halaman terbuka */
const _mem={};
const store={
  get(k){try{return localStorage.getItem(k)}catch(e){return Object.prototype.hasOwnProperty.call(_mem,k)?_mem[k]:null}},
  set(k,v){try{localStorage.setItem(k,v)}catch(e){_mem[k]=String(v)}}
};

function logoFallback(img,name){
  img.style.display='none';
  const box=img.closest('.icon');
  if(!box) return;
  let f=box.querySelector('.logo-fallback');
  if(!f){
    f=document.createElement('span');
    f.className='logo-fallback';
    f.textContent=name.split(/\s+/).map(x=>x[0]).join('').slice(0,4).toUpperCase();
    box.appendChild(f);
  }
}

const products=[
  {name:"Mobile Legends",icon:"⚔️",desc:"Diamond MLBB",prices:[15000,30000,50000,100000,200000,500000],category:"Unggulan",art:"assets/2af379ea90.webp"},
  {name:"Free Fire",icon:"🔥",desc:"Diamond Free Fire",prices:[10000,20000,50000,100000,200000,500000],category:"Unggulan",art:"assets/7c05ed78fa.webp"},
  {name:"Steam Wallet",icon:"🎮",desc:"Steam Wallet IDR",prices:[12000,45000,60000,90000,120000,250000],category:"Unggulan",art:"assets/8ca72b566b.webp"},
  {name:"Roblox",icon:"🧱",desc:"Robux / Gift Cards",prices:[15000,30000,60000,120000,240000,500000],category:"Unggulan",art:"assets/a30be63135.webp"},
  {name:"Magic Chess: Go Go",icon:"♟️",desc:"Top Up Magic Chess",prices:[15000,30000,50000,100000,200000,500000],category:"Unggulan",art:"assets/fabec701d5.webp"},
  {name:"Valorant",icon:"✦",desc:"Valorant Points",prices:[15000,35000,70000,145000,290000,500000],category:"Unggulan",art:"assets/46da8b118d.webp"},
  {name:"Maple Haven City Rush",icon:"🎮",desc:"Top Up / Game Item",prices:[15000,30000,50000,100000,200000,500000],category:"Baru",art:"assets/3b4b250ea3.webp"},
  {name:"AMAR - CHAT & REAL FRIEND",icon:"💬",desc:"Top Up / Credit",prices:[15000,30000,50000,100000,200000,500000],category:"Baru",art:"assets/97c73920e7.webp"},
  {name:"Stranger Than Heaven",icon:"🎮",desc:"Top Up / Game Item",prices:[15000,30000,50000,100000,200000,500000],category:"Baru",art:"assets/66a8abf000.webp"},
  {name:"Persona 4 Revival",icon:"🎮",desc:"Top Up / Game Item",prices:[15000,30000,50000,100000,200000,500000],category:"Baru",art:"assets/c0d16afc75.webp"},
  {name:"PUBG Mobile",icon:"🎯",desc:"UC PUBG Mobile",prices:[16000,32000,60000,120000,240000,500000],category:"Baru",art:"assets/56f7493fd6.webp"},
  {name:"Google Play",icon:"▶️",desc:"Google Play Gift",prices:[15000,25000,50000,100000,200000,500000],category:"Baru",art:"assets/2a1254a199.png"},
  {name:"PlayStation",icon:"🎮",desc:"PSN Wallet",prices:[50000,100000,200000,300000,500000,1000000],category:"Baru",art:"assets/33a364937c.png"},
  {name:"Free Fire Max",icon:"🔥",desc:"Diamond Free Fire MAX",prices:[10000,20000,50000,100000,200000,500000],category:"Unggulan",art:"assets/a8bba9e803.webp"},
  {name:"Call of Duty Mobile",icon:"🎖️",desc:"CP Call of Duty Mobile",prices:[15000,30000,50000,100000,200000,500000],category:"Unggulan",art:"assets/c6e6505529.webp"},
  {name:"Delta Force (Garena)",icon:"🪖",desc:"Top Up Delta Force Garena",prices:[15000,30000,50000,100000,200000,500000],category:"Unggulan",art:"assets/10c61fa606.webp"},
  {name:"Honor of Kings",icon:"👑",desc:"Token Honor of Kings",prices:[15000,30000,50000,100000,200000,500000],category:"Unggulan",art:"assets/a6939c2db3.webp"},
  {name:"Blood Strike",icon:"💥",desc:"Gold Blood Strike",prices:[15000,30000,50000,100000,200000,500000],category:"Baru",art:"assets/d27c32ead6.webp"},
  {name:"Delta Force (Steam)",icon:"🎮",desc:"Top Up Delta Force Steam",prices:[15000,30000,50000,100000,200000,500000],category:"Baru",art:"assets/afd295b5f8.webp"},
  {name:"Point Blank",icon:"🔫",desc:"Cash Point Blank",prices:[15000,30000,50000,100000,200000,500000],category:"Baru",art:"assets/b4ecdb257e.webp"}
];
let transactions=[];

function rupiah(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n)}

// Shared demo store: customer site and admin dashboard use the same browser localStorage.
const STORE_KEY="ditzMarketTx";
const SETTINGS_KEY="ditzMarketSettings";
try { transactions=JSON.parse(store.get(STORE_KEY)||store.get("novaTx")||"[]"); } catch(e){ transactions=[]; }
function gameLogo(p){
 const logos={
  "Mobile Legends":["ML","ml"],"Free Fire":["FF","ff"],"PUBG Mobile":["PUBG","pubg"],
  "Valorant":["V","val"],"Roblox":["RBX","rbx"],"Steam Wallet":["STEAM","steam"],
  "Google Play":["GP","gp"],"PlayStation":["PS","ps"]
 };
 const [label,cls]=logos[p.name]||[p.name.slice(0,3).toUpperCase(),""] ;
 return `<div class="game-logo-badge ${cls}">${label}</div>`;
}
function renderProductCard(p){
  const idx=products.indexOf(p);
  const art=p.art||"";
  const artHtml=art
    ? `<img class="dashboard-game-image" src="${art}" alt="${p.name}">`
    : `<div class="dashboard-game-fallback">${p.name}</div>`;
  return `<div class="dashboard-game-card ${p.disabled?'disabled':''}" ${p.disabled?'title="Produk sedang tidak tersedia"':'onclick="enterGame('+idx+')"'}>
    <div class="dashboard-game-image-wrap">${artHtml}</div>
    <div class="dashboard-game-name">${p.name}</div>
  </div>`;
}
function renderProducts(list=products){
  const box=document.getElementById("products");
  const featured=list.filter(p=>p.category==="Unggulan");
  const fresh=list.filter(p=>p.category==="Baru");
  box.innerHTML=`
    <section class="dashboard-category">
      <h2 class="dashboard-category-title">UNGGULAN</h2>
      <div class="dashboard-game-grid">${featured.map(renderProductCard).join("")}</div>
    </section>
    <section class="dashboard-category">
      <h2 class="dashboard-category-title">BARU</h2>
      <div class="dashboard-game-grid">${fresh.map(renderProductCard).join("")}</div>
    </section>`;
}
let connectionTimer=null;
let connectionProgressTimer=null;
let pendingGameIndex=null;
let pendingGameNominal=null;

function setConnectionProgress(v){
  const el=document.getElementById("connectionProgress");
  if(el)el.style.width=Math.max(0,Math.min(100,v))+"%";
}
function openConnectionLoading(){
  const ov=document.getElementById("connectionOverlay"),loading=document.getElementById("connectionLoadingText"),err=document.getElementById("connectionError");
  if(!ov)return;
  ov.classList.add("show");document.body.classList.add("connection-open");
  if(loading)loading.style.display="block";
  if(err)err.classList.remove("show");
  setConnectionProgress(0);
  clearInterval(connectionProgressTimer);
  let n=0;
  connectionProgressTimer=setInterval(()=>{n=Math.min(92,n+Math.random()*9+3);setConnectionProgress(n)},110);
}
function showConnectionError(){
  clearTimeout(connectionTimer);clearInterval(connectionProgressTimer);
  setConnectionProgress(100);
  const loading=document.getElementById("connectionLoadingText"),err=document.getElementById("connectionError");
  if(loading)loading.style.display="none";
  if(err)err.classList.add("show");
}
function closeConnectionOverlay(){
  clearTimeout(connectionTimer);clearInterval(connectionProgressTimer);
  const ov=document.getElementById("connectionOverlay");
  if(ov)ov.classList.remove("show");
  document.body.classList.remove("connection-open");
  pendingGameIndex=null;pendingGameNominal=null;
}
async function hasInternetConnection(){
  // Hanya dianggap offline jika browser sendiri melaporkan offline.
  return navigator.onLine!==false;
}
async function enterGame(i,nominal){
  const p=products[i];
  if(!p||p.disabled){toast("Produk sedang tidak tersedia.");return}
  pendingGameIndex=i;pendingGameNominal=nominal||null;
  openConnectionLoading();
  clearTimeout(connectionTimer);
  connectionTimer=setTimeout(async()=>{
    const online=await hasInternetConnection();
    if(!online){showConnectionError();return}
    clearInterval(connectionProgressTimer);setConnectionProgress(100);
    setTimeout(()=>{
      const gi=pendingGameIndex,gn=pendingGameNominal;
      closeConnectionOverlay();
      openModal(gi,gn);
    },180);
  },900);
}
window.addEventListener("offline",()=>{if(document.getElementById("connectionOverlay")?.classList.contains("show"))showConnectionError()});

function scrollToProducts(){showTab("dashboard",document.querySelector(".nav button"));setTimeout(()=>document.getElementById("produk").scrollIntoView({behavior:"smooth"}),50)}
function toast(msg){let t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
/* ==========================================================
   SISTEM PEMBAYARAN & DAFTAR TOP UP
   Semua pengaturan penting ada di blok KONFIGURASI di bawah.
   ========================================================== */

/* ---------- KONFIGURASI ---------- */
const SERVICE_FEE=1500;          // biaya layanan per pesanan (Rp)
const UNIQUE_CODE_ENABLED=true;  // true = tambah kode unik 10-99 agar pembayaran mudah dicocokkan
const PAY_WINDOW_MIN=15;         // batas waktu pembayaran (menit)
const NMID="ID1025427537390";
const PAYMENT_METHODS={
  QRIS:{icon:"▦",title:"QRIS",desc:"Scan dengan aplikasi bank / e-wallet",type:"qr"},
  DANA:{icon:"D",title:"DANA",desc:"Transfer ke nomor DANA",type:"account",number:"087855771529",name:"E***"},
  GoPay:{icon:"G",title:"GoPay",desc:"Transfer ke nomor GoPay",type:"account",number:"081934209234",name:"G***"}
};
/* Isi tiap paket. Urutan sama dengan daftar harga di `products`.
   Game yang tidak tercantum memakai label otomatis, mis. "Voucher Rp 15.000". */
const PACKAGE_LABELS={
  "Mobile Legends":["56 Diamonds","113 Diamonds","190 Diamonds","380 Diamonds","770 Diamonds","1.950 Diamonds"],
  "Free Fire":["80 Diamonds","160 Diamonds","400 Diamonds","810 Diamonds","1.640 Diamonds","4.100 Diamonds"],
  "Roblox":["80 Robux","170 Robux","350 Robux","720 Robux","1.500 Robux","3.200 Robux"],
  "Magic Chess: Go Go":["56 Diamonds","113 Diamonds","190 Diamonds","380 Diamonds","770 Diamonds","1.950 Diamonds"],
  "Valorant":["125 VP","300 VP","625 VP","1.275 VP","2.700 VP","4.700 VP"],
  "PUBG Mobile":["60 UC","120 UC","240 UC","480 UC","1.000 UC","2.100 UC"]
};
const LABEL_PREFIX={
  "Steam Wallet":"Steam Wallet","Google Play":"Gift Card","PlayStation":"PSN Wallet",
  "AMAR - CHAT & REAL FRIEND":"Credit","Maple Haven City Rush":"Game Item",
  "Stranger Than Heaven":"Voucher","Persona 4 Revival":"Voucher"
};
const STATUS={UNPAID:"Menunggu Pembayaran",VERIFY:"Menunggu Verifikasi",PAID:"Dibayar - Diproses",EXPIRED:"Kedaluwarsa",CANCELLED:"Dibatalkan"};

/* ---------- CUSTOMER SERVICE (WhatsApp) ---------- */
const CS={name:"Adit",number:"6287855771529"};
function csLink(text){return "https://wa.me/"+CS.number+"?text="+encodeURIComponent(text)}
function csOrderText(t){
  return `Halo Kak ${CS.name}, saya ada kendala dengan pesanan di DITZ MARKET.\n\nID Pesanan: ${t.id}\nProduk: ${t.product}${t.item?" - "+t.item:""}\nID Player: ${t.player}\nTotal: ${rupiah(t.amount)}\nMetode: ${t.method}\nStatus: ${t.status}\n\nMohon dibantu, terima kasih.`;
}

/* ---------- HELPER ---------- */
const $=id=>document.getElementById(id);
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function copyText(text,msg){
  const ok=()=>toast(msg||"Disalin ✓"),t=String(text);
  const legacy=()=>{try{const a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();const r=document.execCommand("copy");a.remove();r?ok():toast("Salin manual: "+t)}catch(e){toast("Salin manual: "+t)}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,legacy);else legacy();
}

/* ---------- PAKET TOP UP ---------- */
function packageLabel(p,j,price){
  const l=(PACKAGE_LABELS[p.name]||[])[j];
  if(l&&price===p.basePrices[j])return l;   // harga diubah admin → pakai label nominal
  const short=price%1000===0?(price>=1000000?(price/1000000)+" Jt":(price/1000)+"K"):rupiah(price);
  return (LABEL_PREFIX[p.name]||"Top Up")+" "+short;
}
function syncPackages(p){p.packages=p.prices.map((price,j)=>({label:packageLabel(p,j,price),price}))}
(function(){const m=products.find(p=>p.name==="Mobile Legends");m.prices=ML_FLAT.map(x=>x.price);PACKAGE_LABELS["Mobile Legends"]=ML_FLAT.map(x=>x.label);Object.keys(GAME_PRICES).forEach(n=>{const q=products.find(p=>p.name===n);if(!q)return;q.prices=GAME_PRICES[n].map(x=>x[1]);PACKAGE_LABELS[n]=GAME_PRICES[n].map(x=>x[0])})})();
products.forEach(p=>{p.basePrices=p.prices.slice();syncPackages(p)});
function applySettings(){
  const st=loadSettings();
  products.forEach(p=>{
    const x=st[p.name];
    p.prices=(x&&Array.isArray(x.prices)&&x.prices.length===p.basePrices.length)?x.prices.map(Number):p.basePrices.slice();p.disabled=!!(x&&x.disabled);
    syncPackages(p);
  });
}

/* ---------- STATE ---------- */
let mlSold={};let selectedProduct=null,selectedPkg=0,selectedMethod="QRIS",currentOrder=null,pendingUnique=0,timerInterval=null;

function calcTotals(){
  const pkg=selectedProduct?selectedProduct.packages[selectedPkg]:null;
  const price=pkg?pkg.price:0;
  const fee=price>0?SERVICE_FEE:0;
  const uniq=price>0&&UNIQUE_CODE_ENABLED?pendingUnique:0;
  const disc=promoApplied?Math.min(promoApplied.discount,Math.max(0,price-1000)):0;
  return {price,fee,uniq,disc,total:price-disc+fee+uniq};
}

/* ---------- FORM PESANAN ---------- */
function openModal(i,pkgIdx){
  selectedProduct=products[i];
  selectedPkg=(pkgIdx!=null&&selectedProduct.packages[pkgIdx])?pkgIdx:0;
  selectedMethod=Object.keys(PAYMENT_METHODS)[0];
  pendingUnique=0;
  currentOrder=null;clearInterval(timerInterval);
  $("modalTitle").textContent="Top Up "+selectedProduct.name;
  $("modalSub").textContent=selectedProduct.desc+" · isi data lalu pilih metode pembayaran.";
  $("player").value="";$("wa").value="";$("zone").value="";$("agree").checked=false;clearPromo();applyFields();$("zone").oninput=updateSummary;
  $("player").oninput=updateSummary;
  const thumb=$("sumThumb");thumb.src=selectedProduct.art||"";thumb.style.display=selectedProduct.art?"block":"none";
  const off=!!loadSettings().paymentDisabled;
  $("payOffNote").style.display=off?"block":"none";$("btnOrder").disabled=off;
  renderPackages();renderMethods();updateSummary();
  $("stepForm").style.display="";$("stepPay").style.display="none";
  $("modal").classList.add("show");document.querySelector(".checkout-modal").scrollTop=0;
}
function fieldOf(n){return Object.assign({label:"ID Player / Username",ph:"Masukkan ID player"},fieldsMeta[n]||{})}
function applyFields(){
  const f=fieldOf(selectedProduct.name);
  $("playerLabel").textContent=f.label;$("player").placeholder=f.ph||"";
  $("zoneRow").style.display=f.zone?"block":"none";
  $("waOpt").textContent=f.needWa?"(wajib untuk voucher)":"(opsional)";updateNote();
}
function updateNote(){const a=autoMethods.includes(selectedMethod);$("payNote").textContent=a?"Pembayaran terdeteksi otomatis. Waktu bayar 15 menit sejak pesanan dibuat.":"Waktu bayar 15 menit sejak pesanan dibuat. Kode unik Rp10–Rp99 ditambahkan ke total saat pesanan dibuat."}
/* ---------- BUKA APLIKASI PEMBAYARAN ---------- */
const PAY_APPS={GoPay:{t:"GoPay",pkg:"com.gojek.app",scheme:"gojek://"},DANA:{t:"DANA",pkg:"id.dana",scheme:"dana://"},OVO:{t:"OVO",pkg:"ovo.id",scheme:"ovo://"},ShopeePay:{t:"ShopeePay",pkg:"com.shopee.id",scheme:"shopeeid://"}};
function appPicker(method,isQr,amount){
  const keys=Object.keys(PAY_APPS).sort((a,b)=>(b===method)-(a===method));
  return `<div class="app-pick"><button type="button" class="app-btn" style="width:100%;margin-bottom:10px" onclick="copyText('${amount}','Total ${rupiah(amount)} disalin ✓')">📋 Salin total ${rupiah(amount)}</button><small>${isQr?"Pilih aplikasi untuk membayar:":"Buka aplikasi:"}</small><div class="app-pick-row">${keys.map(k=>`<button type="button" class="app-btn ${k===method?"primary":""}" onclick="openPayApp('${k}')">${PAY_APPS[k].t}</button>`).join("")}</div>${isQr?`<a class="app-save" href="assets/qris-ditz.png" download="QRIS-DITZ-MARKET.png">⬇ Simpan QR ke galeri</a>`:""}</div>`;
}
function openPayApp(k){
  const a=PAY_APPS[k],ua=navigator.userAgent;
  if(!/Android|iPhone|iPad/i.test(ua)){toast("Buka halaman ini dari HP untuk langsung membuka aplikasi "+a.t+".");return}
  let left=false;const h=()=>{if(document.hidden)left=true};document.addEventListener("visibilitychange",h);
  setTimeout(()=>{document.removeEventListener("visibilitychange",h);if(!left)toast("Aplikasi "+a.t+" tidak terbuka. Pastikan sudah terpasang.")},2000);
  location.href=/Android/i.test(ua)?"intent://#Intent;package="+a.pkg+";end":a.scheme;
}
function payLink(tx){
  if(tx.method==="DANA"){const mob=/Android|iPhone|iPad/i.test(navigator.userAgent);return (mob?tx.deeplink:tx.checkoutUrl)||tx.checkoutUrl||tx.deeplink||""}
  return tx.deeplink||"";
}
function AUTO_STEPS(tx){
  const tot=`Bayar sesuai total <b>${rupiah(tx.amount)}</b>.`,fin="Halaman ini berubah otomatis saat pembayaran diterima. Tidak perlu menekan tombol apa pun.";
  if(tx.method==="QRIS")return ["Buka aplikasi bank atau e-wallet yang mendukung QRIS.","Scan kode QR di atas.",tot,fin];
  if(tx.method==="DANA")return ["Tekan tombol <b>Bayar dengan DANA</b> di atas, lalu selesaikan pembayaran di aplikasi atau halaman DANA.",tot,"Setelah selesai, kembali ke halaman ini. "+fin];
  return ["Buka aplikasi GoPay lewat tombol di atas, atau scan kode QR dari aplikasi GoPay.",tot,fin];
}
let payPoll=null;
function startPoll(tx){
  clearInterval(payPoll);if(!tx||!tx.auto||tx.status!==STATUS.UNPAID)return;
  payPoll=setInterval(async()=>{
    if(!currentOrder||currentOrder.id!==tx.id){clearInterval(payPoll);return}
    await loadOrders();const t=transactions.find(x=>x.id===tx.id);
    if(t&&currentOrder&&currentOrder.id===tx.id&&t.status!==currentOrder.status){
      currentOrder=t;renderPayState();
      if(t.status!==STATUS.UNPAID){clearInterval(payPoll);clearInterval(timerInterval);if(t.status===STATUS.PAID)toast("Pembayaran diterima ✓")}
    }
  },4000);
}
function readAsDataURL(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
async function uploadProof(inp){
  const f=inp.files[0];if(!f||!currentOrder)return;
  if(!/^image\//.test(f.type)){toast("Pilih file gambar.");inp.value="";return}
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;readAsDataURL(f).then(u=>{i.src=u},rej)});
    const sc=Math.min(1,1000/Math.max(img.width,img.height)),c=document.createElement("canvas");
    c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));
    const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
    $("proofState").textContent="Mengunggah...";
    const d=await API("/orders/"+currentOrder.id+"/proof",{method:"POST",body:{image:c.toDataURL("image/jpeg",0.7)}});
    replaceTx(d.order);renderPayState();toast("Bukti pembayaran terkirim ✓");
  }catch(e){$("proofState").textContent="";toast(e.message||"Gagal mengunggah gambar.")}
  inp.value="";
}
function openLegal(tab){closeModal(true);showTab(tab)}
function renderPackages(){
  const p=selectedProduct,ml=p.name==="Mobile Legends";let last=-1,h="";
  p.packages.forEach((k,j)=>{
    const m=ml?ML_FLAT[j]:null;
    if(m&&m.sec!==last){last=m.sec;const sc=ML_CATALOG[m.sec];h+=`<div class="nom-sec">${esc(sc.t)}${sc.ltd?' <span class="ltd-tag">STOK TERBATAS</span>':''}</div>`}
    const left=m&&m.stock?Math.max(0,m.stock-(mlSold[j]||0)):null;
    h+=`<button type="button" class="${j===selectedPkg?'selected':''}" ${left===0?'disabled':''} onclick="selectPkg(${j})"><b>${esc(k.label)}</b><small>${rupiah(k.price)}</small>${left!==null?`<em class="ltd">${left?'Sisa '+left:'Habis'}</em>`:''}</button>`;
  });
  $("nominals").innerHTML=h;
}
function selectPkg(j){selectedPkg=j;if(promoApplied){clearPromo();toast("Paket berubah, kode promo dicek ulang saat kamu menekan Pakai.")}renderPackages();updateSummary()}
function clearPromo(){promoApplied=null;$("promoCode").value="";$("promoMsg").textContent="";$("promoMsg").className="promo-msg";if(selectedProduct)updateSummary()}
async function applyPromo(){
  const code=$("promoCode").value.trim(),msg=$("promoMsg");
  if(!code){msg.textContent="Masukkan kode promo.";msg.className="promo-msg err";return}
  try{
    const d=await API("/promo/check",{method:"POST",body:{code,product:selectedProduct.name,pkg:selectedPkg}});
    promoApplied={code:d.code,discount:d.discount};msg.textContent="✓ Kode "+d.code+" dipakai. Hemat "+rupiah(d.discount)+".";msg.className="promo-msg ok";updateSummary();
  }catch(e){promoApplied=null;msg.textContent=e.message;msg.className="promo-msg err";updateSummary()}
}
function renderMethods(){
  $("methods").innerHTML=Object.entries(PAYMENT_METHODS).map(([k,m])=>`<label class="method ${k===selectedMethod?'selected':''}" data-m="${k}"><span class="method-main"><span class="method-icon">${m.icon}</span><span><b>${m.title}</b><small>${m.desc}${autoMethods.includes(k)?" · terverifikasi otomatis":""}</small></span></span><input type="radio" name="method" ${k===selectedMethod?'checked':''} onchange="selectMethod('${k}')"></label>`).join("");
}
function selectMethod(k){
  selectedMethod=k;
  document.querySelectorAll("#methods .method").forEach(x=>x.classList.toggle("selected",x.dataset.m===k));updateNote();
}
function updateSummary(){
  if(!selectedProduct)return;
  const t=calcTotals(),pkg=selectedProduct.packages[selectedPkg];
  $("sumProduct").textContent=selectedProduct.name;
  $("sumItem").textContent=pkg?pkg.label:"-";
  const pl=$("player").value.trim(),zn=$("zone").value.trim(),fz=fieldOf(selectedProduct.name).zone;$("sumPlayer").textContent=pl?"ID: "+pl+(fz&&zn?" ("+zn+")":""):"ID belum diisi";
  $("subtotal").textContent=rupiah(t.price);$("discRow").style.display=t.disc?"flex":"none";$("disc").textContent="-"+rupiah(t.disc);
  $("fee").textContent=rupiah(t.fee);
  $("uniqRow").style.display=t.uniq?"flex":"none";$("uniq").textContent=rupiah(t.uniq);
  $("total").textContent=rupiah(t.total);
}
/* ---------- HALAMAN PEMBAYARAN ---------- */
function showPayment(tx){
  currentOrder=tx;
  const m=PAYMENT_METHODS[tx.method]||{title:tx.method,type:"account",icon:"•"};
  $("stepForm").style.display="none";$("stepPay").style.display="";
  $("modalTitle").textContent="Selesaikan Pembayaran";
  $("modalSub").textContent="Pesanan "+tx.id+" · "+tx.product;
  const prod=products.find(p=>p.name===tx.product),art=prod&&prod.art;
  const thumb=$("payThumb");thumb.src=art||"";thumb.style.display=art?"block":"none";
  $("payProduct").textContent=tx.product;$("payItem").textContent=tx.item||"-";$("payPlayer").textContent="ID: "+tx.player;
  $("payOrderId").textContent=tx.id;$("payMethodName").textContent=m.title;
  $("payPrice").textContent=rupiah(tx.listPrice!=null?tx.listPrice:(tx.price!=null?tx.price:tx.amount-SERVICE_FEE));
  $("payDiscRow").style.display=tx.discount?"flex":"none";$("payDisc").textContent="-"+rupiah(tx.discount||0);$("payPromo").textContent=tx.promo?"("+tx.promo+")":"";
  $("payFee").textContent=rupiah(tx.fee!=null?tx.fee:SERVICE_FEE);
  $("payUniqRow").style.display=tx.uniqueCode?"flex":"none";$("payUniq").textContent=rupiah(tx.uniqueCode||0);
  $("payTotal").textContent=rupiah(tx.amount);$("payTotalBig").textContent=rupiah(tx.amount);
  $("payMethodLabel").textContent="BAYAR VIA "+String(m.title).toUpperCase();
  const isQr=m.type==="qr";
  const auto=!!tx.auto;
  $("qrPayment").style.display=isQr&&!auto?"block":"none";$("qrAuto").style.display=auto&&tx.method!=="DANA"?"block":"none";
  if(auto&&tx.method!=="DANA")$("qrAutoImg").src="/api/orders/"+encodeURIComponent(tx.id)+"/qr";
  $("btnPaid").style.display=$("paidNote").style.display=auto?"none":"";
  $("payAccountBox").innerHTML=auto?(payLink(tx)?`<a class="btn" style="display:block;text-align:center;text-decoration:none" href="${esc(payLink(tx))}"${/^https:/.test(payLink(tx))?' target="_blank" rel="noopener"':''}>${tx.method==="DANA"?"Bayar dengan DANA":"Buka aplikasi "+esc(m.title)}</a>`:""):isQr?"":`<div class="account-info"><div><small>Nomor ${esc(m.title)}</small><b>${esc(m.number)}</b><small>A/n ${esc(m.name)}</small></div><button type="button" class="copy-btn" onclick="copyText('${esc(m.number)}','Nomor ${esc(m.title)} disalin ✓')">SALIN</button></div>`;
  if(!auto)$("payAccountBox").innerHTML+=appPicker(tx.method,isQr,tx.amount);
  const exact=`Bayar <b>tepat ${rupiah(tx.amount)}</b>${tx.uniqueCode?` (sudah termasuk kode unik ${rupiah(tx.uniqueCode)})`:""}.`;
  const steps=auto?AUTO_STEPS(tx):isQr
    ?["Tekan salah satu aplikasi di bawah QR untuk membukanya (atau scan dari HP lain).","Di aplikasi pilih Bayar/Scan, lalu unggah QR dari galeri (tekan Simpan QR dulu).",exact,"Selesaikan pembayaran, lalu tekan <b>Saya Sudah Membayar</b>."]
    :[`Buka aplikasi ${esc(m.title)}.`,`Kirim ke nomor <b>${esc(m.number)}</b> a/n ${esc(m.name)}.`,exact,"Setelah berhasil, tekan <b>Saya Sudah Membayar</b>."];
  $("paySteps").innerHTML=steps.map(x=>`<li>${x}</li>`).join("");
  renderPayState();startTimer();startPoll(tx);
  $("modal").classList.add("show");document.querySelector(".checkout-modal").scrollTop=0;
}
function renderPayState(){
  const tx=currentOrder;if(!tx)return;
  const s=tx.status,unpaid=s===STATUS.UNPAID,box=$("payNotice");
  let msg="",cls="";
  if(s===STATUS.VERIFY){cls="info";msg="✓ Pembayaran dikonfirmasi. Admin sedang memverifikasi, pesanan diproses setelah pembayaran terverifikasi."}
  else if(s===STATUS.EXPIRED){cls="danger";msg="Waktu pembayaran habis. Pesanan dibatalkan otomatis — silakan buat pesanan baru."}
  else if(s===STATUS.CANCELLED){cls="danger";msg="Pesanan dibatalkan."}
  else if(s===STATUS.PAID){cls="success";msg="✓ Pembayaran diterima. Pesananmu sedang diproses admin."}
  else if(!unpaid){cls="success";msg="✓ "+s+(tx.sn?" · Kode/SN: "+tx.sn:"")}
  box.style.display=msg?"block":"none";box.className="pay-state "+cls;box.textContent=msg;
  $("payTimerWrap").style.display=unpaid?"flex":"none";
  $("proofBox").style.display=(!tx.auto&&(s===STATUS.UNPAID||s===STATUS.VERIFY))?"block":"none";$("proofState").textContent=tx.proof?"✓ Bukti sudah terkirim. Mengunggah lagi akan menggantinya.":"";
  $("payInstruct").style.display=unpaid?"block":"none";
  $("payActions").style.display=unpaid?"block":"none";
  $("payDoneActions").style.display=unpaid?"none":"block";
  $("payCs").href=csLink(csOrderText(tx));
}
function closeModal(silent){
  clearInterval(timerInterval);clearInterval(payPoll);
  const unpaid=currentOrder&&currentOrder.status===STATUS.UNPAID;
  $("modal").classList.remove("show");
  if(unpaid&&silent!==true)toast("Pesanan tersimpan di Riwayat. Selesaikan pembayaran sebelum waktu habis.");
  currentOrder=null;
}
function copyTotal(){if(currentOrder)copyText(currentOrder.amount,"Nominal "+rupiah(currentOrder.amount)+" disalin ✓")}
function goHistory(){closeModal(true);showTab("history",document.querySelectorAll(".nav button")[3])}
/* ---------- RIWAYAT ---------- */
function statusClass(s){
  s=String(s||"").toLowerCase();
  if(/berhasil|sukses|selesai|success|lunas|paid/.test(s))return"success";
  if(/batal|kedaluwarsa|gagal|expired|ditolak/.test(s))return"danger";
  if(/verifikasi|proses/.test(s))return"info";
  return"pending";
}
function renderHistory(){
  sweepExpired();
  const box=$("historyBox");if(!box)return;
  const mine=transactions.filter(t=>t.user===authUser);if(!mine.length){box.innerHTML='<div class="empty">Belum ada transaksi.</div>';return}
  box.innerHTML=`<table class="history"><thead><tr><th>ID</th><th>Produk</th><th>Total</th><th>Metode</th><th>Status</th></tr></thead><tbody>${mine.slice(0,20).map(t=>`<tr><td>${esc(t.id)}<br><small>${esc(t.date||"")}</small></td><td>${esc(t.product)}${t.item?`<br><small>${esc(t.item)}</small>`:""}<br><small>${esc(t.player)}</small></td><td>${rupiah(t.amount)}</td><td>${esc(t.method)}</td><td><span class="badge ${statusClass(t.status)}">${esc(t.status)}</span>${t.sn?`<br><small>Kode/SN: ${esc(t.sn)}</small>`:""}${t.status===STATUS.UNPAID?`<button type="button" class="row-btn" onclick="resumePayment('${esc(t.id)}')">Bayar</button>`:""}<a class="row-btn cs" href="${csLink(csOrderText(t))}" target="_blank" rel="noopener">CS</a></td></tr>`).join("")}</tbody></table>`;
}
function updateStats(){const count=$("txCount"),total=$("totalSpend");if(count)count.textContent=transactions.length;if(total)total.textContent=rupiah(transactions.reduce((a,b)=>a+b.amount,0))}

/* ---------- DAFTAR HARGA ---------- */
function priceCard(p){
  const idx=products.indexOf(p);
  return `<div class="card pl-card ${p.disabled?'disabled':''}"><div class="pl-head">${p.art?`<img src="${p.art}" alt="">`:""}<div><h3>${esc(p.name)}</h3><small>${esc(p.desc)}</small></div>${p.disabled?'<span class="badge danger">Tidak tersedia</span>':''}</div><div class="pl-items">${p.packages.map((k,j)=>`<button type="button" class="pl-item" ${p.disabled?'disabled':`onclick="enterGame(${idx},${j})"`}><b>${esc(k.label)}</b><small>${rupiah(k.price)}</small></button>`).join("")}</div></div>`;
}
function renderPriceList(list=products){
  const box=$("priceList");if(!box)return;
  if(!list.length){box.innerHTML='<div class="empty">Game tidak ditemukan.</div>';return}
  box.innerHTML=[["Unggulan","Unggulan"],["Baru","Baru"]].map(([cat,title])=>{
    const items=list.filter(p=>p.category===cat);
    return items.length?`<section class="dashboard-category"><h2 class="dashboard-category-title">${title}</h2><div class="pl-grid">${items.map(priceCard).join("")}</div></section>`:"";
  }).join("");
}
function filterProducts(){
  const q=$("search").value.toLowerCase();
  const list=products.filter(p=>p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q));
  renderProducts(list);renderPriceList(list);
}

/* ---------- NAVIGASI ---------- */
function showTab(tab,btn){
  ["dashboard","prices","history","about","help","terms","privacy","refund"].forEach(id=>{const el=$(id);if(el)el.style.display=id===tab?"block":"none"});
  document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active"));if(btn)btn.classList.add("active");
  if(tab==="history"){renderHistory();loadOrders()}
  window.scrollTo({top:0});
}


/* ==========================================================
   KONEKSI KE BACKEND (API) — akun, katalog, dan pesanan ada di server
   ========================================================== */
const API=async(path,opts={})=>{
  const r=await fetch("/api"+path,{method:opts.method||"GET",headers:{"Content-Type":"application/json","X-Requested-With":"ditz"},credentials:"same-origin",body:opts.body?JSON.stringify(opts.body):undefined});
  let d={};try{d=await r.json()}catch(e){}
  if(!r.ok){const err=new Error(d.error||"Terjadi kesalahan ("+r.status+")");err.status=r.status;throw err}
  return d;
};
let promoApplied=null,autoMethods=[],fieldsMeta={},clockSkew=0,settingsCache={},authUser="",authAdmin=false,authMode="login";
const now=()=>Date.now()+clockSkew;
function syncClock(t){if(t)clockSkew=t-Date.now()}
function loadSettings(){return settingsCache}
async function loadCatalog(){try{const d=await API("/catalog");syncClock(d.serverTime);settingsCache=Object.assign({},d.products,{paymentDisabled:d.paymentDisabled});fieldsMeta=d.fields||{};mlSold=d.mlSold||{};if(selectedProduct&&selectedProduct.name==="Mobile Legends"&&$("stepForm").offsetParent)renderPackages();autoMethods=d.autoMethods||[];applySettings();renderProducts();renderPriceList()}catch(e){}}
async function loadOrders(){if(!authUser)return;try{const d=await API("/orders");syncClock(d.serverTime);transactions=d.orders;renderHistory()}catch(e){if(e.status===401)applySession(false)}}
function replaceTx(o){const i=transactions.findIndex(x=>x.id===o.id);if(i>=0)transactions[i]=o;else transactions.unshift(o);if(currentOrder&&currentOrder.id===o.id)currentOrder=o}
function sweepExpired(){transactions.forEach(t=>{if(t.status===STATUS.UNPAID&&t.expiresAt&&now()>t.expiresAt)t.status=STATUS.EXPIRED})}

/* ---------- pesanan ---------- */
async function createOrder(){
  if(loadSettings().paymentDisabled){toast("Pembayaran sedang dinonaktifkan oleh admin.");return}
  if(!selectedProduct||selectedProduct.disabled){toast("Produk sedang tidak tersedia.");return}
  const player=$("player").value.trim();
  const f=fieldOf(selectedProduct.name);
  if(!player){toast("Masukkan "+f.label+" terlebih dahulu.");$("player").focus();return}
  if(f.re&&!new RegExp(f.re).test(player)){toast(f.err||("Format "+f.label+" tidak valid."));$("player").focus();return}
  const zone=$("zone").value.trim();
  if(f.zone&&!/^\d{3,6}$/.test(zone)){toast("Zone ID wajib diisi (3–6 angka).");$("zone").focus();return}
  const wa=$("wa").value.trim();
  if(wa&&!/^(\+?62|0)8\d{7,12}$/.test(wa.replace(/[\s-]/g,""))){toast("Nomor WhatsApp tidak valid.");$("wa").focus();return}
  if(f.needWa&&!wa){toast("Nomor WhatsApp wajib diisi untuk produk voucher.");$("wa").focus();return}
  if(!$("agree").checked){toast("Centang persetujuan Syarat & Ketentuan terlebih dahulu.");return}
  const pkg=selectedProduct.packages[selectedPkg],btn=$("btnOrder");
  btn.disabled=true;btn.textContent="Membuat pesanan...";
  try{
    const d=await API("/orders",{method:"POST",body:{product:selectedProduct.name,pkg:selectedPkg,item:pkg.label,player,zone,agree:true,promo:promoApplied?promoApplied.code:"",whatsapp:wa,method:selectedMethod}});Promise.resolve(loadCatalog()).catch(()=>{});
    syncClock(d.serverTime);replaceTx(d.order);renderHistory();showPayment(d.order);
  }catch(e){toast(e.message);if(e.status===401)applySession(false)}
  finally{btn.disabled=false;btn.textContent="Lanjut ke Pembayaran →"}
}
function startTimer(){
  clearInterval(timerInterval);
  const tx=currentOrder;if(!tx||tx.status!==STATUS.UNPAID)return;
  const el=$("timer");
  const tick=()=>{
    const left=Math.max(0,Math.floor(((tx.expiresAt||0)-now())/1000));
    el.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0");
    if(left<=0){clearInterval(timerInterval);expireOrder(tx.id)}
  };
  tick();timerInterval=setInterval(tick,1000);
}
async function expireOrder(id){
  await loadOrders();
  const t=transactions.find(x=>x.id===id);
  if(t&&currentOrder&&currentOrder.id===id){if(t.status===STATUS.UNPAID)t.status=STATUS.EXPIRED;currentOrder=t;renderPayState()}
}
async function confirmPaid(){
  if(!currentOrder)return;
  const id=currentOrder.id;
  try{
    const d=await API("/orders/"+id+"/paid",{method:"POST"});
    clearInterval(timerInterval);replaceTx(d.order);renderPayState();renderHistory();
    toast("Terima kasih! Pembayaran menunggu verifikasi admin.");
  }catch(e){toast(e.message);await loadOrders();const t=transactions.find(x=>x.id===id);if(t){currentOrder=t;renderPayState()}}
}
async function cancelOrder(){
  if(!currentOrder)return;
  try{
    const d=await API("/orders/"+currentOrder.id+"/cancel",{method:"POST"});
    clearInterval(timerInterval);replaceTx(d.order);renderHistory();closeModal(true);toast("Pesanan dibatalkan.");
  }catch(e){toast(e.message);loadOrders()}
}
function resumePayment(id){
  sweepExpired();
  const tx=transactions.find(x=>x.id===id);
  if(!tx||tx.status!==STATUS.UNPAID){toast("Pesanan ini tidak bisa dibayar lagi.");renderHistory();return}
  showPayment(tx);
}

/* ---------- akun ---------- */
function setAuthMode(m){
  authMode=m;const reg=m==="register",rst=m==="reset";
  $("tabLogin").classList.toggle("on",m==="login");$("tabReg").classList.toggle("on",reg);
  $("regRow").style.display=reg||rst?"block":"none";$("aPass2").required=reg||rst;
  $("codeRow").style.display=rst?"block":"none";$("aCode").required=rst;
  $("forgotLink").style.display=m==="login"?"block":"none";$("backLink").style.display=rst?"block":"none";$("resetWa").style.display=rst?"block":"none";
  $("lPass").textContent=rst?"Password baru":"Password";
  $("aPass").autocomplete=reg||rst?"new-password":"current-password";
  $("authBtn").textContent=rst?"Setel Password Baru":reg?"Buat Akun":"Masuk";
  $("authSub").textContent=rst?"Minta kode reset ke admin lewat WhatsApp (sebutkan username kamu), lalu isi di sini. Kode berlaku 30 menit.":reg?"Buat akun gratis. Username 3–20 karakter (huruf kecil, angka, _), password minimal 8 karakter.":"Masuk untuk mulai top up dan melihat riwayat pesananmu.";
  $("authMsg").textContent="";
}
async function submitAuth(e){
  e.preventDefault();const msg=$("authMsg"),btn=$("authBtn");msg.textContent="";
  const name=$("aUser").value.trim().toLowerCase(),pw=$("aPass").value;
  if((authMode==="register"||authMode==="reset")&&pw!==$("aPass2").value){msg.textContent="Konfirmasi password tidak sama.";return}
  if(authMode==="reset"){
    btn.disabled=true;
    try{await API("/reset-password",{method:"POST",body:{username:name,code:$("aCode").value,password:pw}});$("aPass").value="";$("aPass2").value="";$("aCode").value="";setAuthMode("login");toast("Password diperbarui. Silakan masuk.")}
    catch(err){msg.textContent=err.message}
    finally{btn.disabled=false}
    return;
  }
  btn.disabled=true;
  try{
    const d=await API(authMode==="register"?"/register":"/login",{method:"POST",body:{username:name,password:pw}});
    authUser=d.user;authAdmin=!!d.admin;syncClock(d.serverTime);
    $("aPass").value="";$("aPass2").value="";applySession(true);await loadOrders();toast("Selamat datang, "+d.user+"!");
  }catch(err){msg.textContent=err.message;$("aPass").value=""}
  finally{btn.disabled=false}
}
function applySession(ok){
  setTimeout(()=>{const al=document.getElementById("adminLink");if(al)al.style.display=authAdmin?"":"none"},0);
  if(ok===false){authUser="";authAdmin=false;transactions=[]}
  if(!authUser){$("authGate").classList.add("show");document.body.classList.add("connection-open");return false}
  $("authGate").classList.remove("show");document.body.classList.remove("connection-open");
  $("userName").innerHTML="Halo, "+esc(authUser)+(authAdmin?'<span class="admin-chip">Admin</span>':"");
  $("userAvatar").textContent=authUser.charAt(0).toUpperCase();
  renderHistory();return true;
}
async function logoutUser(){
  try{await API("/logout",{method:"POST"})}catch(e){}
  closeModal(true);showTab("dashboard",document.querySelector(".nav button"));
  applySession(false);$("aUser").value="";setAuthMode("login");
}
async function initApp(){
  loadCatalog();
  try{const d=await API("/me");syncClock(d.serverTime);if(d.user){authUser=d.user;authAdmin=!!d.admin;applySession(true);await loadOrders()}else applySession(false)}
  catch(e){applySession(false)}
  setInterval(()=>{if(authUser)loadOrders()},20000);
  setInterval(loadCatalog,60000);
}
$("authForm").onsubmit=submitAuth;

renderProducts();renderPriceList();renderHistory();updateStats();initApp();
