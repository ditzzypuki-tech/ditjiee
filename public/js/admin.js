const IDLEMS=20*60000,SHOP="/";
const PRODUCTS=[["Mobile Legends",[15000,30000,50000,100000,200000,500000]],["Free Fire",[10000,20000,50000,100000,200000,500000]],["Steam Wallet",[12000,45000,60000,90000,120000,250000]],["Roblox",[15000,30000,60000,120000,240000,500000]],["Magic Chess: Go Go",[15000,30000,50000,100000,200000,500000]],["Valorant",[15000,35000,70000,145000,290000,500000]],["Maple Haven City Rush",[15000,30000,50000,100000,200000,500000]],["AMAR - CHAT & REAL FRIEND",[15000,30000,50000,100000,200000,500000]],["Stranger Than Heaven",[15000,30000,50000,100000,200000,500000]],["Persona 4 Revival",[15000,30000,50000,100000,200000,500000]],["PUBG Mobile",[16000,32000,60000,120000,240000,500000]],["Google Play",[15000,25000,50000,100000,200000,500000]],["PlayStation",[50000,100000,200000,300000,500000,1000000]],["Free Fire Max",[10000,20000,50000,100000,200000,500000]],["Call of Duty Mobile",[15000,30000,50000,100000,200000,500000]],["Delta Force (Garena)",[15000,30000,50000,100000,200000,500000]],["Honor of Kings",[15000,30000,50000,100000,200000,500000]],["Blood Strike",[15000,30000,50000,100000,200000,500000]],["Delta Force (Steam)",[15000,30000,50000,100000,200000,500000]],["Point Blank",[15000,30000,50000,100000,200000,500000]]];
PRODUCTS.forEach(x=>{const g=window.GAME_PRICES&&window.GAME_PRICES[x[0]];if(g)x[1]=g.map(i=>i[1])});
const TABS=[["home","Ringkasan"],["orders","Pesanan"],["products","Produk"],["promos","Promo"],["users","Akun"],["settings","Pengaturan"]];
const $=s=>document.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rp=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
function toast(m){const t=$("#toast");t.textContent=m;t.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display="none",2600)}
const API=async(path,opts={})=>{
  const r=await fetch("/api"+path,{method:opts.method||"GET",headers:{"Content-Type":"application/json","X-Requested-With":"ditz"},credentials:"same-origin",body:opts.body?JSON.stringify(opts.body):undefined});
  let d={};try{d=await r.json()}catch(e){}
  if(!r.ok){const err=new Error(d.error||"Terjadi kesalahan ("+r.status+")");err.status=r.status;throw err}
  return d;
};
let TXC=[],SETC={products:{},paymentDisabled:false},USERS=[],PROMOS=[],tab="home",fq="",fs="",last=Date.now(),poll=null;
const getTx=()=>TXC;
async function refresh(){const [o,s,u,pr]=await Promise.all([API("/admin/orders"),API("/admin/settings"),API("/admin/users"),API("/admin/promos")]);TXC=o.orders;SETC=s;USERS=u.users;PROMOS=pr.promos}
function sc(s){s=String(s||"").toLowerCase();return /berhasil|sukses|selesai|lunas/.test(s)?"success":/batal|kedaluwarsa|gagal|ditolak/.test(s)?"danger":/verifikasi|proses/.test(s)?"info":"pending"}
function fail(e){if(e.status===401||e.status===403){showGate();}toast(e.message)}

/* Login admin: panel hanya terbuka untuk akun ber-peran admin. */
async function logout(){try{await API("/logout",{method:"POST"})}catch(e){}location.href="index.html"}
function showGate(){
  clearInterval(poll);const app=$("#app");app.hidden=false;
  app.innerHTML=`<div id="gate"><div class="card form" style="max-width:340px;width:100%"><div class="brand" style="margin:0 0 6px"><img class="logo" src="assets/logo.svg" alt="">DITZ<span>MARKET</span><small>Login Admin</small></div>
  <label>Username</label><input id="lg_u" autocomplete="username" autocapitalize="none">
  <label>Password</label><input id="lg_p" type="password" autocomplete="current-password">
  <button class="b" id="lg_b">Masuk</button><a href="index.html" style="font-size:12px;text-align:center">← Kembali ke Toko</a></div></div>`;
  const go_=async()=>{try{await API("/login",{method:"POST",body:{username:$("#lg_u").value,password:$("#lg_p").value}});
    const m=await API("/me");if(!m.admin){await API("/logout",{method:"POST"});return toast("Akun ini bukan admin.")}
    await openApp()}catch(e){toast(e.message)}};
  $("#lg_b").onclick=go_;$("#lg_p").onkeydown=e=>{if(e.key==="Enter")go_()};
}
(async()=>{try{const m=await API("/me");if(m.admin)await openApp();else showGate()}catch(e){showGate()}})();

/* ===== APLIKASI ===== */
async function openApp(){
  await refresh();last=Date.now();
  const g=$("#gate");if(g)g.hidden=true;const app=$("#app");app.hidden=false;
  app.innerHTML=`<aside class="side"><div class="brand"><img class="logo" src="assets/logo.svg" alt="">DITZ<span>MARKET</span><small>Admin Panel</small></div><nav>${TABS.map(([k,l])=>`<button data-t="${k}" onclick="go('${k}')">${l}</button>`).join("")}</nav><div class="side-foot"><a href="${SHOP}">← Ke Toko</a> <button class="g" onclick="logout()">Keluar</button></div></aside><main id="view"></main>`;
  go(tab);clearInterval(poll);
  poll=setInterval(async()=>{try{await refresh();if(tab==="orders")drawOrders();else if(tab==="home"||tab==="users")go(tab)}catch(e){fail(e)}},15000);
}
function go(t){tab=t;document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));const v=$("#view");
  v.innerHTML=({home:vHome,orders:vOrders,products:vProducts,promos:vPromos,users:vUsers,settings:vSettings})[t]();if(t==="orders")drawOrders();window.scrollTo(0,0)}

function vHome(){
  const a=getTx(),today=new Date().toDateString(),done=a.filter(t=>sc(t.status)==="success"),wait=a.filter(t=>["Menunggu Verifikasi","Dibayar - Diproses"].includes(t.status));
  return `<h2>Ringkasan</h2><p class="sub">Semua pesanan dari seluruh pembeli.</p>
  <div class="stats"><div class="card"><small>Total pesanan</small><b>${a.length}</b></div><div class="card"><small>Perlu diproses</small><b style="color:var(--amber)">${wait.length}</b></div><div class="card"><small>Berhasil</small><b style="color:var(--green)">${done.length}</b></div><div class="card"><small>Pendapatan</small><b>${rp(done.reduce((s,t)=>s+(t.amount||0),0))}</b></div></div>
  <div class="card"><div class="row"><h3 style="margin:0">Perlu diproses</h3><small>${a.filter(t=>new Date(t.createdAt).toDateString()===today).length} pesanan hari ini</small></div><div class="tw">${table(wait.slice(0,8))}</div></div>`;
}
function table(list){
  if(!list.length)return '<div class="empty">Tidak ada pesanan.</div>';
  return `<table><thead><tr><th>ID</th><th>Produk</th><th>Total</th><th>Metode</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${list.map(t=>{
    const wa=String(t.whatsapp||"").replace(/\D/g,"").replace(/^0/,"62");
    return `<tr><td><b>${esc(t.id)}</b><br><small>${esc(t.date||"")}</small></td><td>${esc(t.product)}${t.item?`<br><small>${esc(t.item)}</small>`:""}<br><small>ID: ${esc(t.player)}</small>${t.user?`<br><small>Akun: ${esc(t.user)}</small>`:""}${t.auto?`<br><small style="color:var(--green)">Otomatis (gateway)</small>`:""}${t.promo?`<br><small>Promo ${esc(t.promo)}: -${rp(t.discount)}</small>`:""}${t.sup?`<br><small style="color:${t.sup.state==='done'?'var(--green)':'var(--amber)'}">Supplier: ${esc(t.sup.state)}${t.sup.sn?" · "+esc(t.sup.sn):""}</small>`:""}${t.note?`<br><small style="color:var(--amber)">${esc(t.note)}</small>`:""}</td><td>${rp(t.amount)}</td><td>${esc(t.method)}</td><td><span class="badge ${sc(t.status)}">${esc(t.status)}</span></td>
    <td><div class="acts">${t.status==="Menunggu Verifikasi"||t.status==="Menunggu Pembayaran"?`<button class="b" onclick="accPay('${esc(t.id)}')">Acc Bayar</button>`:""}<button class="b ok" onclick="setSt('${esc(t.id)}','Berhasil')">Berhasil</button><button class="d" onclick="setSt('${esc(t.id)}','Dibatalkan')">Tolak</button>${wa?`<a class="g b" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent("Halo, pesanan DITZ MARKET "+t.id+" ("+t.product+") statusnya: "+t.status)}">WA</a>`:""}${t.proof?`<a class="g b" target="_blank" rel="noopener" href="/api/admin/orders/${esc(t.id)}/proof">Bukti</a>`:""}<button class="g" onclick="delTx('${esc(t.id)}')">Hapus</button></div></td></tr>`}).join("")}</tbody></table>`;
}
async function accPay(id){if(!confirm("Pastikan uang sudah masuk sesuai total (termasuk kode unik). Acc pembayaran "+id+"?"))return;await setSt(id,"Dibayar - Diproses")}
async function setSt(id,s){try{await API("/admin/orders/"+id,{method:"POST",body:{status:s}});await refresh();go(tab);toast("Status "+id+": "+s)}catch(e){fail(e)}}
async function delTx(id){if(!confirm("Hapus pesanan "+id+"? Tindakan ini tidak bisa dibatalkan."))return;try{await API("/admin/orders/"+id,{method:"DELETE"});await refresh();go(tab);toast("Pesanan dihapus")}catch(e){fail(e)}}

function vOrders(){return `<h2>Pesanan</h2><p class="sub">Verifikasi pembayaran dan ubah status pesanan. Diperbarui otomatis tiap 15 detik.</p>
  <div class="tools"><input id="fq" placeholder="Cari ID, produk, akun, ID player..." value="${esc(fq)}" oninput="fq=this.value;drawOrders()"><select id="fs" onchange="fs=this.value;drawOrders()">${["","Menunggu Pembayaran","Menunggu Verifikasi","Dibayar - Diproses","Berhasil","Kedaluwarsa","Dibatalkan"].map(s=>`<option value="${s}" ${s===fs?"selected":""}>${s||"Semua status"}</option>`).join("")}</select></div>
  <div class="card tw" id="ot" style="padding:0"></div>`}
function drawOrders(){const q=fq.toLowerCase();$("#ot").innerHTML=table(getTx().filter(t=>(!fs||t.status===fs)&&(!q||[t.id,t.product,t.item,t.player,t.user].join(" ").toLowerCase().includes(q))))}

function vProducts(){const st=SETC.products||{};return `<h2>Produk & Harga</h2><p class="sub">Aktifkan/nonaktifkan game dan ubah 6 harga paket. Harga dihitung di server, jadi pembeli tidak bisa mengubahnya. <b>Kode SKU</b> (dari Digiflazz) hanya perlu diisi bila ingin top up dikirim otomatis; kosong berarti diproses manual.</p>
  <div class="card tw" style="padding:0"><table><thead><tr><th>Game</th><th>Tersedia</th><th>Harga paket (Rp)</th><th>Kode SKU supplier</th><th></th></tr></thead><tbody>${PRODUCTS.map(([n,def],i)=>{const x=st[n]||{},pr=Array.isArray(x.prices)&&x.prices.length===6?x.prices:def;
  return `<tr><td><b>${esc(n)}</b></td><td><label class="sw"><input type="checkbox" id="av${i}" ${x.disabled?"":"checked"}><span></span></label></td><td><div class="pr">${pr.map((v,j)=>`<input type="number" min="1000" step="500" id="p${i}_${j}" value="${v}">`).join("")}</div></td><td><div class="pr">${[0,1,2,3,4,5].map(j=>`<input type="text" maxlength="40" placeholder="kosong = manual" id="s${i}_${j}" value="${esc(((SETC.skus||{})[n]||[])[j]||"")}">`).join("")}</div></td><td><div class="acts"><button class="b" onclick="saveProd(${i})">Simpan</button><button class="g" onclick="resetProd(${i})">Reset</button></div></td></tr>`}).join("")}</tbody></table></div>`}
async function saveProd(i){const n=PRODUCTS[i][0],pr=[0,1,2,3,4,5].map(j=>Math.round(Number($("#p"+i+"_"+j).value)));
  if(pr.some(v=>!(v>=1000)))return toast("Harga minimal Rp1.000 untuk semua paket");
  const sk=[0,1,2,3,4,5].map(j=>$("#s"+i+"_"+j).value.trim());
  try{SETC=await API("/admin/settings",{method:"PUT",body:{products:{[n]:{prices:pr,disabled:!$("#av"+i).checked}},skus:{[n]:sk}}});toast(n+" disimpan")}catch(e){fail(e)}}
async function resetProd(i){try{SETC=await API("/admin/settings",{method:"PUT",body:{reset:[PRODUCTS[i][0]]}});go("products");toast("Direset ke harga awal")}catch(e){fail(e)}}

function vUsers(){return `<h2>Akun</h2><p class="sub">Daftar akun yang terdaftar di toko.</p><div class="card tw" style="padding:0"><table><thead><tr><th>Username</th><th>Peran</th><th>Bergabung</th><th>Pesanan</th><th></th></tr></thead><tbody>${USERS.map(u=>`<tr><td><b>${esc(u.username)}</b></td><td><span class="badge ${u.role==="admin"?"info":"pending"}">${esc(u.role)}</span></td><td>${new Date(u.created).toLocaleDateString("id-ID")}</td><td>${u.orders}</td><td>${u.role==="admin"?"":`<button class="g" onclick="resetUser('${esc(u.username)}')">Reset password</button>`}</td></tr>`).join("")}</tbody></table></div>`}
function vPromos(){return `<h2>Kode Promo</h2><p class="sub">Diskon dipotong dari harga paket (biaya layanan tidak didiskon). Satu kode hanya bisa dipakai sekali per akun.</p>
  <div class="card"><div class="form" style="max-width:440px"><label>Kode (huruf besar/angka)</label><input id="pc_code" maxlength="20" style="text-transform:uppercase">
  <label>Jenis</label><select id="pc_type"><option value="percent">Persen (%)</option><option value="flat">Nominal (Rp)</option></select>
  <label>Nilai (persen 1–90, atau rupiah)</label><input id="pc_val" type="number" min="1">
  <label>Maks. diskon Rp (opsional, untuk persen)</label><input id="pc_max" type="number" min="0">
  <label>Minimal harga paket Rp (opsional)</label><input id="pc_min" type="number" min="0">
  <label>Kuota pemakaian (0 = tanpa batas)</label><input id="pc_uses" type="number" min="0" value="0">
  <label>Berlaku sampai (opsional)</label><input id="pc_exp" type="date">
  <button class="b" onclick="savePromo()">Simpan kode</button></div></div>
  <div class="card tw" style="padding:0">${PROMOS.length?`<table><thead><tr><th>Kode</th><th>Diskon</th><th>Syarat</th><th>Terpakai</th><th>Status</th><th></th></tr></thead><tbody>${PROMOS.map(p=>`<tr><td><b>${esc(p.code)}</b></td><td>${p.type==="percent"?p.value+"%"+(p.maxDiscount?" (maks "+rp(p.maxDiscount)+")":""):rp(p.value)}</td><td><small>${p.minPrice?"min "+rp(p.minPrice)+" · ":""}${p.expires?"sampai "+new Date(p.expires).toLocaleDateString("id-ID"):"tanpa batas waktu"}</small></td><td>${p.used}${p.maxUses?" / "+p.maxUses:""}</td><td><span class="badge ${p.active?"success":"pending"}">${p.active?"Aktif":"Nonaktif"}</span></td><td><div class="acts"><button class="g" onclick="togglePromo('${esc(p.code)}')">${p.active?"Nonaktifkan":"Aktifkan"}</button><button class="d" onclick="delPromo('${esc(p.code)}')">Hapus</button></div></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Belum ada kode promo.</div>'}</div>`}
async function putPromo(p){await API("/admin/promos",{method:"PUT",body:p});await refresh();go("promos")}
async function savePromo(){
  const e=$("#pc_exp").value;
  try{await putPromo({code:$("#pc_code").value,type:$("#pc_type").value,value:$("#pc_val").value,maxDiscount:$("#pc_max").value,minPrice:$("#pc_min").value,maxUses:$("#pc_uses").value,expires:e?new Date(e+"T23:59:59").getTime():0,active:true});toast("Kode promo disimpan")}catch(x){fail(x)}
}
async function togglePromo(c){const p=PROMOS.find(x=>x.code===c);try{await putPromo(Object.assign({},p,{active:!p.active}));toast(p.active?"Dinonaktifkan":"Diaktifkan")}catch(x){fail(x)}}
async function delPromo(c){if(!confirm("Hapus kode "+c+"?"))return;try{await API("/admin/promos/"+c,{method:"DELETE"});await refresh();go("promos");toast("Kode dihapus")}catch(x){fail(x)}}
async function resetUser(u){if(!confirm("Buat kode reset password untuk "+u+"? Kode berlaku 30 menit."))return;try{const d=await API("/admin/users/"+u+"/reset",{method:"POST"});prompt("Kirim kode ini ke "+u+" lewat WhatsApp (berlaku "+d.minutes+" menit):",d.code)}catch(e){fail(e)}}

function vSettings(){const off=!!SETC.paymentDisabled;return `<h2>Pengaturan</h2><p class="sub">Pembayaran, keamanan akun, dan data.</p>
  <div class="card"><div class="row"><div><b>Pembayaran aktif</b><br><small>Jika dimatikan, pembeli tidak bisa membuat pesanan baru.</small></div><label class="sw"><input type="checkbox" ${off?"":"checked"} onchange="togglePay(this.checked)"><span></span></label></div></div>
  <div class="card"><h3 style="margin-top:0">Status integrasi</h3><div class="acts">${[["Midtrans (QRIS/GoPay)","midtrans"],["Xendit (DANA)","xendit"],["Digiflazz (top up otomatis)","digiflazz"],["Webhook Digiflazz","digiflazzWebhook"],["Telegram (notifikasi)","telegram"]].map(([l,k])=>`<span class="badge ${(SETC.integrations||{})[k]?"success":"pending"}">${l}: ${(SETC.integrations||{})[k]?"aktif":"belum aktif"}</span>`).join("")}</div><p class="sub" style="margin:10px 0 0">Aktifkan lewat variabel lingkungan di server. Lihat README.md.</p></div>
  <div class="card"><h3 style="margin-top:0">Data pesanan</h3><div class="acts"><button class="g" onclick="exportCsv()">Unduh CSV</button><button class="g" onclick="exportJson()">Unduh JSON (cadangan)</button><button class="d" onclick="clearAll()">Hapus semua pesanan</button></div></div>`}
async function togglePay(on){try{SETC=await API("/admin/settings",{method:"PUT",body:{paymentDisabled:!on}});toast(on?"Pembayaran diaktifkan":"Pembayaran dinonaktifkan")}catch(e){fail(e)}}
async function changePw(){const cur=$("#pc").value,n1=$("#pn").value,n2=$("#pn2").value;
  if(n1.length<8)return toast("Password baru minimal 8 karakter");if(n1!==n2)return toast("Konfirmasi password tidak sama");
  try{await API("/admin/password",{method:"POST",body:{current:cur,next:n1}});["#pc","#pn","#pn2"].forEach(s=>$(s).value="");toast("Password diubah")}catch(e){fail(e)}}
function dl(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove()}
function exportJson(){dl("pesanan-ditz-market.json",JSON.stringify(getTx(),null,2),"application/json")}
function exportCsv(){const c=["id","date","user","product","item","player","whatsapp","price","fee","uniqueCode","amount","method","status"];
  dl("pesanan-ditz-market.csv",[c.join(","),...getTx().map(t=>c.map(k=>'"'+String(t[k]==null?"":t[k]).replace(/"/g,'""')+'"').join(","))].join("\n"),"text/csv")}
async function clearAll(){if(!confirm("Hapus SEMUA pesanan dari server? Unduh cadangan dulu jika perlu."))return;try{await API("/admin/orders",{method:"DELETE"});await refresh();go(tab);toast("Semua pesanan dihapus")}catch(e){fail(e)}}
