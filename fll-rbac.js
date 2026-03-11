/**
 * FLL RBAC Module v1.0
 * نظام صلاحيات الأدوار — فيرست لاين لوجستيكس
 *
 * Role-based access control for all dashboard pages.
 * Uses Cognito groups stored in localStorage.
 */

const FLL_ROLES={
  super_admin:{label:'مدير النظام',pages:['*']},
  SystemAdmin:{label:'مدير النظام',pages:['*']},
  finance_manager:{label:'مدير مالي',pages:['/staff-finance','/finance-wallets','/finance-reconciliation','/finance-payout-batches','/finance-adjustments','/finance-profitability','/finance-fraud-queue','/finance-insights','/finance-rules','/finance-upload-center']},
  finance_analyst:{label:'محلل مالي',pages:['/staff-finance','/finance-wallets','/finance-reconciliation','/finance-profitability','/finance-insights','/finance-rules']},
  ops_manager:{label:'مدير عمليات',pages:['/staff-ops','/staff-dashboard']},
  ops_supervisor:{label:'مشرف عمليات',pages:['/staff-ops','/staff-dashboard']},
  hr_manager:{label:'مدير موارد بشرية',pages:['/staff-hr','/staff-dashboard']},
  fleet_manager:{label:'مدير أسطول',pages:['/staff-fleet','/staff-dashboard']},
  driver:{label:'سائق',pages:['/courier-dashboard']},
  admin:{label:'مشرف',pages:['/admin-dashboard','/staff-dashboard','/staff-finance','/staff-ops','/staff-hr','/staff-fleet']},
  staff:{label:'موظف',pages:['/staff-dashboard']},
  executive:{label:'تنفيذي',pages:['/admin-dashboard','/staff-finance','/finance-profitability','/finance-insights']}
};

const FLL_NAV_GROUPS={
  finance:{
    label:'المالية',
    icon:'wallet',
    items:[
      {path:'/staff-finance',label:'لوحة المالية',icon:'layout-dashboard'},
      {path:'/finance-wallets',label:'المحافظ',icon:'wallet'},
      {path:'/finance-payout-batches',label:'دفعات الرواتب',icon:'banknote'},
      {path:'/finance-reconciliation',label:'التسويات',icon:'scale'},
      {path:'/finance-adjustments',label:'التعديلات',icon:'file-edit'},
      {path:'/finance-rules',label:'القواعد المالية',icon:'settings-2'},
      {path:'/finance-profitability',label:'الربحية',icon:'trending-up'},
      {path:'/finance-fraud-queue',label:'كشف الاحتيال',icon:'shield-alert'},
      {path:'/finance-insights',label:'رؤى ذكية',icon:'brain'},
      {path:'/finance-upload-center',label:'مركز الرفع',icon:'upload'}
    ],
    roles:['super_admin','SystemAdmin','admin','finance_manager','finance_analyst','executive']
  },
  operations:{
    label:'العمليات',
    icon:'activity',
    items:[
      {path:'/staff-ops',label:'لوحة العمليات',icon:'activity'},
      {path:'/staff-dashboard',label:'النظرة العامة',icon:'layout-dashboard'}
    ],
    roles:['super_admin','SystemAdmin','admin','ops_manager','ops_supervisor','staff']
  },
  hr:{
    label:'الموارد البشرية',
    icon:'users',
    items:[
      {path:'/staff-hr',label:'الموارد البشرية',icon:'users'},
      {path:'/hr-onboarding',label:'الالتحاق',icon:'user-plus'},
      {path:'/hr-contracts',label:'العقود',icon:'file-signature'}
    ],
    roles:['super_admin','SystemAdmin','admin','hr_manager']
  },
  fleet:{
    label:'الأسطول',
    icon:'truck',
    items:[
      {path:'/staff-fleet',label:'إدارة الأسطول',icon:'truck'},
      {path:'/fleet-costs',label:'تكاليف الأسطول',icon:'calculator'}
    ],
    roles:['super_admin','SystemAdmin','admin','fleet_manager']
  },
  admin:{
    label:'الإدارة',
    icon:'shield',
    items:[
      {path:'/admin-dashboard',label:'لوحة الإدارة',icon:'shield'},
      {path:'/admin-tools-health',label:'صحة التكاملات',icon:'heart-pulse'},
      {path:'/admin-feature-flags',label:'أعلام الميزات',icon:'toggle-left'},
      {path:'/admin-audit',label:'سجل التدقيق',icon:'scroll-text'},
      {path:'/marketplace-integrations',label:'التكاملات',icon:'plug'}
    ],
    roles:['super_admin','SystemAdmin','admin','executive']
  }
};

/**
 * Check if user has access to a specific page
 * @param {string} pagePath - Current page path
 * @returns {boolean}
 */
function hasPageAccess(pagePath){
  const user=JSON.parse(localStorage.getItem('fll_user')||'null');
  if(!user)return false;
  const groups=user.groups||[];
  if(groups.includes('super_admin')||groups.includes('SystemAdmin'))return true;
  const cleanPath=pagePath.replace('.html','').replace(/\/$/,'');
  for(const group of groups){
    const role=FLL_ROLES[group];
    if(!role)continue;
    if(role.pages.includes('*'))return true;
    if(role.pages.some(p=>cleanPath.startsWith(p)||cleanPath===p))return true;
  }
  return false;
}

/**
 * Guard current page — redirect to unauthorized if no access
 */
function guardPage(){
  const path=window.location.pathname.replace('.html','').replace(/\/$/,'')||'/';
  if(path==='/'||path==='/unified-login'||path==='/login'||path==='/unauthorized')return;
  if(!hasPageAccess(path)){
    window.location.href='/unauthorized';
  }
}

/**
 * Get navigation items for current user
 * @returns {Object} Navigation groups the user can see
 */
function getUserNav(){
  const user=JSON.parse(localStorage.getItem('fll_user')||'null');
  if(!user)return{};
  const groups=user.groups||[];
  const isSuperAdmin=groups.includes('super_admin')||groups.includes('SystemAdmin');
  const nav={};
  for(const[key,group]of Object.entries(FLL_NAV_GROUPS)){
    if(isSuperAdmin||group.roles.some(r=>groups.includes(r))){
      nav[key]={...group,items:group.items.filter(item=>isSuperAdmin||hasPageAccess(item.path))};
    }
  }
  return nav;
}

/**
 * Render sidebar navigation HTML
 * @returns {string} HTML for sidebar nav
 */
function renderSidebarNav(){
  const nav=getUserNav();
  let html='';
  for(const[key,group]of Object.entries(nav)){
    html+=`<div class="nav-group">
      <div class="nav-group-label"><i data-lucide="${group.icon}" style="width:14px;height:14px"></i> ${group.label}</div>`;
    for(const item of group.items){
      const active=window.location.pathname.includes(item.path)?'active':'';
      html+=`<a href="${item.path}" class="nav-link ${active}"><i data-lucide="${item.icon}" style="width:14px;height:14px"></i> ${item.label}</a>`;
    }
    html+='</div>';
  }
  return html;
}

/**
 * Get user's primary role label
 */
function getUserRoleLabel(){
  const user=JSON.parse(localStorage.getItem('fll_user')||'null');
  if(!user)return'';
  const groups=user.groups||[];
  for(const g of groups){
    if(FLL_ROLES[g])return FLL_ROLES[g].label;
  }
  return'موظف';
}

// Export for use in pages
if(typeof window!=='undefined'){
  window.FLL_RBAC={hasPageAccess,guardPage,getUserNav,renderSidebarNav,getUserRoleLabel,FLL_ROLES,FLL_NAV_GROUPS};
}
console.log('✅ FLL RBAC Module loaded');
