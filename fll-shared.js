/**
 * FLL Shared Dashboard Module v1.0
 * مشترك بين كل صفحات Staff الفرعية
 */
const SUPABASE_URL = 'https://djebhztfewjfyyoortvv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWJoenRmZXdqZnl5b29ydHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODE2OTYsImV4cCI6MjA4NjY1NzY5Nn0.763DeRupf7g8pP4USMRnYSNT8WJcgckCFaeh3D2wml8';
const AWS_API = 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com';
let sb;
function initSupabase(){sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);return sb;}
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
  const c={success:'#059669',error:'#dc2626',info:'#2563eb',warning:'#d97706'};
  const t=document.createElement('div');t.id='fll-toast';
  t.style.cssText=`position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;padding:14px 32px;border-radius:12px;color:#fff;font-size:15px;font-weight:600;font-family:Tajawal,sans-serif;direction:rtl;box-shadow:0 8px 32px rgba(0,0,0,.3);max-width:90%;text-align:center;background:${c[type]||c.info}`;
  t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}
function formatMoney(n){return parseFloat(n||0).toLocaleString('ar-SA',{minimumFractionDigits:2})+' ر.س';}
function formatDate(d){return d?new Date(d).toLocaleDateString('ar-SA'):'—';}
function badge(text,color){return `<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${color==='green'?'#dcfce7':color==='red'?'#fee2e2':color==='yellow'?'#fef9c3':color==='blue'?'#dbeafe':'#f3f4f6'};color:${color==='green'?'#166534':color==='red'?'#991b1b':color==='yellow'?'#854d0e':color==='blue'?'#1e40af':'#374151'}">${text}</span>`;}
console.log('✅ FLL Shared Module loaded');
// deploy trigger 1772929821
