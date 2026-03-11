/**
 * FLL Shared Dashboard Module v1.0
 * مشترك بين كل صفحات Staff الفرعية
 */
const AWS_API = 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com';
function checkAuth(){const u=JSON.parse(localStorage.getItem('fll_user')||'null');if(!u||!localStorage.getItem('fll_token')){window.location.href='/unified-login';return null;}return u;}
function logout(){localStorage.removeItem('fll_token');localStorage.removeItem('fll_user');window.location.href='/';}
function setUserInfo(user){
  const el=id=>document.getElementById(id);
  if(el('user-name'))el('user-name').textContent=user.name||user.username||user.email||'مستخدم';
  if(el('user-role'))el('user-role').textContent=(user.groups||[]).join(', ')||'staff';
  if(el('user-avatar'))el('user-avatar').textContent=(user.name||user.email||'م')[0];
  if(el('current-date'))el('current-date').textContent=new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}
function showToast(msg,type='info'){
  const old=document.getElementById('fll-toast');if(old)old.remove();
  const c={success:'rgba(5,150,105,0.9)',error:'rgba(220,38,38,0.9)',info:'rgba(2,132,199,0.9)',warning:'rgba(217,119,6,0.9)'};
  const t=document.createElement('div');t.id='fll-toast';
  t.style.cssText=`position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;padding:14px 32px;border-radius:12px;color:#fff;font-size:15px;font-weight:600;font-family:'IBM Plex Sans Arabic',sans-serif;direction:rtl;box-shadow:0 8px 32px rgba(0,0,0,.4);backdrop-filter:blur(10px);border:1px solid rgba(56,189,248,0.1);max-width:90%;text-align:center;background:${c[type]||c.info}`;
  t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}
function formatMoney(n){return parseFloat(n||0).toLocaleString('ar-SA',{minimumFractionDigits:2})+' ر.س';}
function formatDate(d){return d?new Date(d).toLocaleDateString('ar-SA'):'—';}
function badge(text,color){return `<span style="padding:3px 10px;border-radius:8px;font-size:11px;font-weight:600;background:${color==='green'?'rgba(34,197,94,0.15)':color==='red'?'rgba(239,68,68,0.15)':color==='yellow'?'rgba(251,191,36,0.15)':color==='blue'?'rgba(56,189,248,0.15)':color==='purple'?'rgba(167,139,250,0.15)':'rgba(255,255,255,0.05)'};color:${color==='green'?'#86efac':color==='red'?'#fca5a5':color==='yellow'?'#fde68a':color==='blue'?'#7dd3fc':color==='purple'?'#c4b5fd':'#94a3b8'}">${text}</span>`;}
console.log('✅ FLL Shared Module loaded');
// v6 dark theme + lucide icons
try{lucide.createIcons()}catch(e){}
// deploy trigger 1773211225
