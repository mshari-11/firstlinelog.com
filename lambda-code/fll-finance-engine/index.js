/**
 * FLL Finance Engine Lambda v1.0
 * محرك الحساب المالي — فيرست لاين لوجستيكس
 *
 * Routes: /finance/*
 * Database: DynamoDB (with Aurora migration path)
 * Auth: Cognito JWT required
 */
const{DynamoDBClient}=require("@aws-sdk/client-dynamodb");
const{DynamoDBDocumentClient,GetCommand,PutCommand,ScanCommand,QueryCommand,UpdateCommand}=require("@aws-sdk/lib-dynamodb");
const{CognitoIdentityProviderClient,GetUserCommand}=require("@aws-sdk/client-cognito-identity-provider");

const db=DynamoDBDocumentClient.from(new DynamoDBClient({region:"me-south-1"}));
const cognito=new CognitoIdentityProviderClient({region:"me-south-1"});

// DynamoDB table names (mirrors Aurora finance schema)
const TABLES={
  wallets:"fll-driver-wallets",
  ledger:"fll-wallet-ledger",
  payoutBatches:"fll-payout-batches",
  payoutItems:"fll-payout-items",
  reconciliationRuns:"fll-reconciliation-runs",
  reconciliationItems:"fll-reconciliation-items",
  adjustments:"fll-manual-adjustments",
  approvals:"fll-finance-approvals",
  fraudFlags:"fll-fraud-flags",
  rateCards:"fll-rate-cards",
  bonusRules:"fll-bonus-rules",
  penaltyRules:"fll-penalty-rules",
  settings:"fll-system-settings",
  auditLog:"fll-audit-log",
  drivers:"fll-drivers",
  orders:"fll-orders",
};

const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN||'https://fll.sa';
const H={"Access-Control-Allow-Origin":ALLOWED_ORIGIN,"Access-Control-Allow-Headers":"Content-Type,Authorization","Access-Control-Allow-Methods":"GET,POST,PUT,OPTIONS","Content-Type":"application/json"};
const R=(s,b)=>({statusCode:s,headers:H,body:JSON.stringify(b)});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).substr(2,8);

// Feature flag check
async function isFeatureEnabled(flag){
  try{
    const r=await db.send(new GetCommand({TableName:TABLES.settings,Key:{id:flag}}));
    return r.Item?.enabled===true;
  }catch(e){return false;}
}

// Auth middleware
async function verifyAuth(event){
  const authHeader=(event.headers||{}).authorization||(event.headers||{}).Authorization||'';
  const token=authHeader.replace('Bearer ','');
  if(!token)return null;
  try{
    const result=await cognito.send(new GetUserCommand({AccessToken:token}));
    const attrs=Object.fromEntries((result.UserAttributes||[]).map(a=>[a.Name,a.Value]));
    return{username:result.Username,email:attrs.email||result.Username,groups:attrs['custom:groups']?JSON.parse(attrs['custom:groups']):[]};
  }catch(e){return null;}
}

// Role check
function requireRole(user,roles){
  if(!user)return false;
  const userGroups=user.groups||[];
  if(userGroups.includes('super_admin')||userGroups.includes('SystemAdmin'))return true;
  return roles.some(r=>userGroups.includes(r));
}

// Audit log helper
async function auditLog(action,user,details,resource='finance'){
  try{
    await db.send(new PutCommand({TableName:TABLES.auditLog,Item:{
      id:'AUD-'+uid(),action,user:user?.email||'system',
      details:typeof details==='string'?details:JSON.stringify(details),
      resource,createdAt:new Date().toISOString()
    }}));
  }catch(e){console.error('Audit log error:',e);}
}

exports.handler=async(e)=>{
  const m=e.httpMethod||e.requestContext?.http?.method||"GET";
  if(m==="OPTIONS")return R(200,{});

  // Check feature flag
  const enabled=await isFeatureEnabled('FEATURE_FINANCE_ENGINE');
  if(!enabled)return R(503,{error:"المحرك المالي غير مفعل حالياً",code:"FINANCE_ENGINE_DISABLED"});

  // Auth required for all finance routes
  const user=await verifyAuth(e);
  if(!user)return R(401,{error:"غير مصرح — يرجى تسجيل الدخول",code:"UNAUTHORIZED"});

  const rawPath=e.path||e.rawPath||"/";
  const p=rawPath.split("/").filter(x=>x);
  if(p[0]==="finance")p.shift();
  const route=p[0]||"";const sub=p[1]||null;const action=p[2]||null;
  let body={};try{body=e.body?JSON.parse(e.body):{}}catch(x){}

  try{
    switch(route){
      case "":return R(200,{service:"FLL Finance Engine v1.0",status:"active",timestamp:new Date().toISOString()});
      case "wallets":return handleWallets(m,sub,action,body,user);
      case "payout-batches":return handlePayouts(m,sub,action,body,user);
      case "reconciliation":return handleReconciliation(m,sub,action,body,user);
      case "adjustments":return handleAdjustments(m,sub,action,body,user);
      case "fraud-queue":return handleFraud(m,sub,action,body,user);
      case "rules":return handleRules(m,sub,action,body,user);
      case "reports":return handleReports(m,sub,body,user);
      case "feature-flags":return handleFeatureFlags(m,body,user);
      default:return R(404,{error:"مسار غير موجود: /finance/"+route});
    }
  }catch(err){
    console.error("Finance Engine Error:",err);
    return R(500,{error:"خطأ داخلي في المحرك المالي"});
  }
};

// ==========================================
// WALLETS — المحافظ
// ==========================================
async function handleWallets(m,driverId,action,body,user){
  if(!requireRole(user,['finance_manager','finance_analyst']))
    return R(403,{error:"صلاحية غير كافية"});

  if(m==="GET"&&!driverId){
    const r=await db.send(new ScanCommand({TableName:TABLES.wallets,Limit:200}));
    return R(200,{items:r.Items||[],count:r.Count||0});
  }

  if(m==="GET"&&driverId&&!action){
    const w=await db.send(new GetCommand({TableName:TABLES.wallets,Key:{id:driverId}}));
    if(!w.Item)return R(404,{error:"محفظة غير موجودة"});
    const ledger=await db.send(new ScanCommand({TableName:TABLES.ledger}));
    const entries=(ledger.Items||[]).filter(l=>l.driver_id===driverId).sort((a,b)=>(b.posted_at||'').localeCompare(a.posted_at||''));
    return R(200,{wallet:w.Item,ledger:entries.slice(0,50)});
  }

  if(m==="GET"&&driverId&&action==="ledger"){
    const ledger=await db.send(new ScanCommand({TableName:TABLES.ledger}));
    const entries=(ledger.Items||[]).filter(l=>l.driver_id===driverId).sort((a,b)=>(b.posted_at||'').localeCompare(a.posted_at||''));
    return R(200,{items:entries,count:entries.length});
  }

  if(m==="POST"&&driverId&&(action==="credit"||action==="debit")){
    if(!requireRole(user,['finance_manager']))
      return R(403,{error:"صلاحية غير كافية — يلزم finance_manager"});

    const amount=parseFloat(body.amount);
    if(!amount||amount<=0)return R(400,{error:"المبلغ يجب أن يكون أكبر من صفر"});

    // Get or create wallet
    let wallet;
    const wRes=await db.send(new GetCommand({TableName:TABLES.wallets,Key:{id:driverId}}));
    if(wRes.Item){wallet=wRes.Item;}
    else{wallet={id:driverId,driver_id:driverId,balance:0,pending_balance:0,total_earned:0,total_paid_out:0,total_deductions:0,currency:'SAR',created_at:new Date().toISOString()};}

    const signedAmount=action==='credit'?amount:-amount;
    const newBalance=parseFloat(wallet.balance||0)+signedAmount;

    // Create ledger entry (APPEND-ONLY)
    const ledgerEntry={
      id:'LED-'+uid(),
      driver_id:driverId,
      wallet_id:driverId,
      transaction_type:body.transaction_type||(action==='credit'?'earning':'deduction'),
      amount:signedAmount,
      running_balance:newBalance,
      reference_type:body.reference_type||'manual',
      reference_id:body.reference_id||null,
      description:body.description||'',
      description_ar:body.description_ar||'',
      period_start:body.period_start||null,
      period_end:body.period_end||null,
      posted_at:new Date().toISOString(),
      posted_by:user.email,
      is_reversed:false
    };
    await db.send(new PutCommand({TableName:TABLES.ledger,Item:ledgerEntry}));

    // Update wallet balance (projection — derived from ledger)
    wallet.balance=newBalance;
    if(action==='credit')wallet.total_earned=(parseFloat(wallet.total_earned||0)+amount);
    else wallet.total_deductions=(parseFloat(wallet.total_deductions||0)+amount);
    wallet.updated_at=new Date().toISOString();
    await db.send(new PutCommand({TableName:TABLES.wallets,Item:wallet}));

    await auditLog('wallet_'+action,user,{driver_id:driverId,amount:signedAmount,new_balance:newBalance});
    return R(200,{wallet,ledger_entry:ledgerEntry});
  }

  return R(405,{error:"Method not allowed"});
}

// ==========================================
// PAYOUTS — الدفعات
// ==========================================
async function handlePayouts(m,batchId,action,body,user){
  if(!requireRole(user,['finance_manager','finance_analyst']))
    return R(403,{error:"صلاحية غير كافية"});

  if(m==="GET"&&!batchId){
    const r=await db.send(new ScanCommand({TableName:TABLES.payoutBatches,Limit:100}));
    const items=(r.Items||[]).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
    return R(200,{items,count:r.Count||0});
  }

  if(m==="GET"&&batchId&&!action){
    const b=await db.send(new GetCommand({TableName:TABLES.payoutBatches,Key:{id:batchId}}));
    if(!b.Item)return R(404,{error:"دفعة غير موجودة"});
    const items=await db.send(new ScanCommand({TableName:TABLES.payoutItems}));
    const batchItems=(items.Items||[]).filter(i=>i.batch_id===batchId);
    return R(200,{batch:b.Item,items:batchItems,item_count:batchItems.length});
  }

  if(m==="POST"&&!batchId){
    if(!requireRole(user,['finance_manager']))
      return R(403,{error:"صلاحية غير كافية"});

    const batch={
      id:'PB-'+uid(),
      batch_number:'PAY-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+uid().slice(-4).toUpperCase(),
      period_start:body.period_start,
      period_end:body.period_end,
      payment_method:body.payment_method||'stc_bank',
      total_drivers:0,total_amount:0,
      status:'draft',
      created_by:user.email,
      created_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    };
    await db.send(new PutCommand({TableName:TABLES.payoutBatches,Item:batch}));
    await auditLog('payout_batch_created',user,{batch_id:batch.id,period:body.period_start+' to '+body.period_end});
    return R(201,batch);
  }

  if(m==="POST"&&batchId&&action==="calculate"){
    if(!requireRole(user,['finance_manager']))
      return R(403,{error:"صلاحية غير كافية"});

    const b=await db.send(new GetCommand({TableName:TABLES.payoutBatches,Key:{id:batchId}}));
    if(!b.Item)return R(404,{error:"دفعة غير موجودة"});
    if(b.Item.status!=='draft')return R(400,{error:"لا يمكن حساب دفعة ليست في حالة مسودة"});

    // Get all wallets with positive balance
    const wallets=await db.send(new ScanCommand({TableName:TABLES.wallets}));
    const eligibleWallets=(wallets.Items||[]).filter(w=>parseFloat(w.balance||0)>0);

    let totalAmount=0;
    const payoutItems=[];
    for(const w of eligibleWallets){
      const item={
        id:'PI-'+uid(),
        batch_id:batchId,
        driver_id:w.driver_id||w.id,
        gross_earnings:parseFloat(w.balance||0),
        total_deductions:0,
        fll_commission:0,
        vat_amount:0,
        net_payout:parseFloat(w.balance||0),
        status:'pending',
        created_at:new Date().toISOString()
      };
      payoutItems.push(item);
      totalAmount+=item.net_payout;
      await db.send(new PutCommand({TableName:TABLES.payoutItems,Item:item}));
    }

    // Update batch
    const updated={...b.Item,status:'pending_review',total_drivers:payoutItems.length,total_amount:totalAmount,updated_at:new Date().toISOString()};
    await db.send(new PutCommand({TableName:TABLES.payoutBatches,Item:updated}));
    await auditLog('payout_batch_calculated',user,{batch_id:batchId,drivers:payoutItems.length,total:totalAmount});
    return R(200,{batch:updated,items_created:payoutItems.length,total_amount:totalAmount});
  }

  if(m==="POST"&&batchId&&action==="approve"){
    if(!requireRole(user,['finance_manager','super_admin']))
      return R(403,{error:"صلاحية غير كافية — يلزم finance_manager أو super_admin"});

    const b=await db.send(new GetCommand({TableName:TABLES.payoutBatches,Key:{id:batchId}}));
    if(!b.Item)return R(404,{error:"دفعة غير موجودة"});
    if(b.Item.status!=='pending_review')return R(400,{error:"الدفعة ليست في حالة مراجعة"});
    if(b.Item.created_by===user.email)return R(400,{error:"لا يمكن اعتماد دفعة أنشأتها بنفسك — يلزم فصل الصلاحيات"});

    const updated={...b.Item,status:'approved',approved_by:user.email,approved_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    await db.send(new PutCommand({TableName:TABLES.payoutBatches,Item:updated}));

    // Create approval record
    await db.send(new PutCommand({TableName:TABLES.approvals,Item:{
      id:'APR-'+uid(),request_type:'payout_batch',reference_id:batchId,
      requested_by:b.Item.created_by,status:'approved',
      decided_by:user.email,decided_at:new Date().toISOString(),
      created_at:new Date().toISOString()
    }}));

    await auditLog('payout_batch_approved',user,{batch_id:batchId,total:b.Item.total_amount});
    return R(200,updated);
  }

  if(m==="POST"&&batchId&&action==="execute"){
    if(!requireRole(user,['finance_manager']))
      return R(403,{error:"صلاحية غير كافية"});

    const b=await db.send(new GetCommand({TableName:TABLES.payoutBatches,Key:{id:batchId}}));
    if(!b.Item)return R(404,{error:"دفعة غير موجودة"});
    if(b.Item.status!=='approved')return R(400,{error:"الدفعة غير معتمدة بعد"});

    // Get payout items
    const items=await db.send(new ScanCommand({TableName:TABLES.payoutItems}));
    const batchItems=(items.Items||[]).filter(i=>i.batch_id===batchId);

    // Create ledger entries and zero out wallets
    for(const item of batchItems){
      const ledgerEntry={
        id:'LED-'+uid(),
        driver_id:item.driver_id,
        wallet_id:item.driver_id,
        transaction_type:'payout',
        amount:-item.net_payout,
        running_balance:0,
        reference_type:'payout_batch',
        reference_id:batchId,
        description:'Payout batch '+b.Item.batch_number,
        description_ar:'دفعة رقم '+b.Item.batch_number,
        posted_at:new Date().toISOString(),
        posted_by:user.email,
        is_reversed:false
      };
      await db.send(new PutCommand({TableName:TABLES.ledger,Item:ledgerEntry}));

      // Update wallet
      const w=await db.send(new GetCommand({TableName:TABLES.wallets,Key:{id:item.driver_id}}));
      if(w.Item){
        w.Item.balance=0;
        w.Item.total_paid_out=(parseFloat(w.Item.total_paid_out||0)+item.net_payout);
        w.Item.last_payout_date=new Date().toISOString().slice(0,10);
        w.Item.updated_at=new Date().toISOString();
        await db.send(new PutCommand({TableName:TABLES.wallets,Item:w.Item}));
      }

      // Update item status
      item.status='paid';item.paid_at=new Date().toISOString();
      await db.send(new PutCommand({TableName:TABLES.payoutItems,Item:item}));
    }

    const updated={...b.Item,status:'completed',updated_at:new Date().toISOString()};
    await db.send(new PutCommand({TableName:TABLES.payoutBatches,Item:updated}));
    await auditLog('payout_batch_executed',user,{batch_id:batchId,drivers:batchItems.length,total:b.Item.total_amount});
    return R(200,{batch:updated,items_paid:batchItems.length});
  }

  return R(405,{error:"Method not allowed"});
}

// ==========================================
// RECONCILIATION — التسويات
// ==========================================
async function handleReconciliation(m,runId,action,body,user){
  if(!requireRole(user,['finance_manager','finance_analyst']))
    return R(403,{error:"صلاحية غير كافية"});

  if(m==="GET"&&!runId){
    const r=await db.send(new ScanCommand({TableName:TABLES.reconciliationRuns,Limit:100}));
    const items=(r.Items||[]).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
    return R(200,{items,count:r.Count||0});
  }

  if(m==="GET"&&runId){
    const run=await db.send(new GetCommand({TableName:TABLES.reconciliationRuns,Key:{id:runId}}));
    if(!run.Item)return R(404,{error:"دورة تسوية غير موجودة"});
    const items=await db.send(new ScanCommand({TableName:TABLES.reconciliationItems}));
    const runItems=(items.Items||[]).filter(i=>i.reconciliation_id===runId);
    return R(200,{run:run.Item,items:runItems});
  }

  if(m==="POST"&&!runId){
    // Create new reconciliation run
    if(!body.platform_code||!body.report_date)
      return R(400,{error:"يلزم تحديد المنصة وتاريخ التقرير (platform_code, report_date)"});

    const run={
      id:'REC-'+uid(),
      platform_code:body.platform_code,
      report_date:body.report_date,
      platform_total:parseFloat(body.platform_total||0),
      calculated_total:0,
      variance:0,
      variance_pct:0,
      status:'pending',
      threshold_pct:parseFloat(body.threshold_pct||2),
      created_by:user.email,
      created_at:new Date().toISOString()
    };

    // Calculate internal total from orders
    const orders=await db.send(new ScanCommand({TableName:TABLES.orders}));
    const platformOrders=(orders.Items||[]).filter(o=>
      (o.platform||'').toLowerCase()===body.platform_code.toLowerCase()&&
      (o.order_date||o.created_at||'').startsWith(body.report_date)
    );

    let calcTotal=0;
    const reconcItems=[];
    const driverTotals={};
    for(const o of platformOrders){
      const did=o.courier_id||o.driver_id||'unknown';
      if(!driverTotals[did])driverTotals[did]={platform:0,calculated:0};
      driverTotals[did].calculated+=parseFloat(o.amount||o.total||0);
      calcTotal+=parseFloat(o.amount||o.total||0);
    }

    // Create reconciliation items per driver
    for(const[did,totals]of Object.entries(driverTotals)){
      const platformAmt=totals.platform||0;
      const calcAmt=totals.calculated;
      reconcItems.push({
        id:'RI-'+uid(),
        reconciliation_id:run.id,
        driver_id:did,
        platform_amount:platformAmt,
        calculated_amount:calcAmt,
        variance:platformAmt-calcAmt,
        item_status:'pending',
        created_at:new Date().toISOString()
      });
    }

    run.calculated_total=calcTotal;
    run.variance=run.platform_total-calcTotal;
    run.variance_pct=run.platform_total>0?((run.variance/run.platform_total)*100):0;
    run.status=Math.abs(run.variance_pct)<=run.threshold_pct?'matched':'variance_high';

    await db.send(new PutCommand({TableName:TABLES.reconciliationRuns,Item:run}));
    for(const item of reconcItems){
      await db.send(new PutCommand({TableName:TABLES.reconciliationItems,Item:item}));
    }

    await auditLog('reconciliation_run',user,{run_id:run.id,platform:body.platform_code,variance:run.variance});
    return R(201,{run,items_count:reconcItems.length});
  }

  if(m==="POST"&&runId&&action==="approve"){
    if(!requireRole(user,['finance_manager']))
      return R(403,{error:"صلاحية غير كافية"});

    const run=await db.send(new GetCommand({TableName:TABLES.reconciliationRuns,Key:{id:runId}}));
    if(!run.Item)return R(404,{error:"غير موجود"});
    run.Item.status='approved';run.Item.reviewed_by=user.email;run.Item.reviewed_at=new Date().toISOString();
    await db.send(new PutCommand({TableName:TABLES.reconciliationRuns,Item:run.Item}));
    await auditLog('reconciliation_approved',user,{run_id:runId});
    return R(200,run.Item);
  }

  return R(405,{error:"Method not allowed"});
}

// ==========================================
// ADJUSTMENTS — التعديلات اليدوية
// ==========================================
async function handleAdjustments(m,adjId,action,body,user){
  if(!requireRole(user,['finance_manager','finance_analyst']))
    return R(403,{error:"صلاحية غير كافية"});

  if(m==="GET"&&!adjId){
    const r=await db.send(new ScanCommand({TableName:TABLES.adjustments,Limit:100}));
    const items=(r.Items||[]).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
    return R(200,{items,count:r.Count||0});
  }

  if(m==="GET"&&adjId){
    const a=await db.send(new GetCommand({TableName:TABLES.adjustments,Key:{id:adjId}}));
    return a.Item?R(200,a.Item):R(404,{error:"غير موجود"});
  }

  if(m==="POST"&&!adjId){
    if(!body.driver_id||!body.amount||!body.reason)
      return R(400,{error:"يلزم: driver_id, amount, reason"});

    const adj={
      id:'ADJ-'+uid(),
      driver_id:body.driver_id,
      adjustment_type:body.adjustment_type||'credit',
      amount:parseFloat(body.amount),
      reason:body.reason,
      reason_ar:body.reason_ar||'',
      status:'pending',
      requested_by:user.email,
      requested_at:new Date().toISOString(),
      created_at:new Date().toISOString()
    };
    await db.send(new PutCommand({TableName:TABLES.adjustments,Item:adj}));

    // Create approval request
    await db.send(new PutCommand({TableName:TABLES.approvals,Item:{
      id:'APR-'+uid(),request_type:'manual_adjustment',reference_id:adj.id,
      requested_by:user.email,status:'pending',priority:parseFloat(body.amount)>1000?'high':'normal',
      created_at:new Date().toISOString()
    }}));

    await auditLog('adjustment_requested',user,{adj_id:adj.id,driver:body.driver_id,amount:body.amount});
    return R(201,adj);
  }

  if(m==="POST"&&adjId&&action==="approve"){
    if(!requireRole(user,['finance_manager','super_admin']))
      return R(403,{error:"صلاحية غير كافية"});

    const adj=await db.send(new GetCommand({TableName:TABLES.adjustments,Key:{id:adjId}}));
    if(!adj.Item)return R(404,{error:"غير موجود"});
    if(adj.Item.status!=='pending')return R(400,{error:"التعديل ليس في حالة معلق"});
    if(adj.Item.requested_by===user.email)return R(400,{error:"لا يمكن اعتماد تعديل طلبته بنفسك"});

    adj.Item.status='approved';
    adj.Item.approved_by=user.email;
    adj.Item.approved_at=new Date().toISOString();
    await db.send(new PutCommand({TableName:TABLES.adjustments,Item:adj.Item}));

    // Post to wallet ledger
    const signedAmount=adj.Item.adjustment_type==='credit'?adj.Item.amount:-adj.Item.amount;
    const w=await db.send(new GetCommand({TableName:TABLES.wallets,Key:{id:adj.Item.driver_id}}));
    const wallet=w.Item||{id:adj.Item.driver_id,driver_id:adj.Item.driver_id,balance:0,total_earned:0,total_deductions:0,currency:'SAR',created_at:new Date().toISOString()};
    const newBalance=parseFloat(wallet.balance||0)+signedAmount;

    const ledgerEntry={
      id:'LED-'+uid(),driver_id:adj.Item.driver_id,wallet_id:adj.Item.driver_id,
      transaction_type:'adjustment',amount:signedAmount,running_balance:newBalance,
      reference_type:'manual_adjustment',reference_id:adjId,
      description_ar:'تعديل يدوي: '+adj.Item.reason,
      posted_at:new Date().toISOString(),posted_by:user.email,is_reversed:false
    };
    await db.send(new PutCommand({TableName:TABLES.ledger,Item:ledgerEntry}));

    wallet.balance=newBalance;wallet.updated_at=new Date().toISOString();
    await db.send(new PutCommand({TableName:TABLES.wallets,Item:wallet}));

    await auditLog('adjustment_approved',user,{adj_id:adjId,driver:adj.Item.driver_id,amount:signedAmount});
    return R(200,{adjustment:adj.Item,ledger_entry:ledgerEntry});
  }

  if(m==="POST"&&adjId&&action==="reject"){
    const adj=await db.send(new GetCommand({TableName:TABLES.adjustments,Key:{id:adjId}}));
    if(!adj.Item)return R(404,{error:"غير موجود"});
    adj.Item.status='rejected';adj.Item.reviewed_by=user.email;adj.Item.reviewed_at=new Date().toISOString();
    adj.Item.rejection_reason=body.reason||'';
    await db.send(new PutCommand({TableName:TABLES.adjustments,Item:adj.Item}));
    await auditLog('adjustment_rejected',user,{adj_id:adjId});
    return R(200,adj.Item);
  }

  return R(405,{error:"Method not allowed"});
}

// ==========================================
// FRAUD — كشف الاحتيال
// ==========================================
async function handleFraud(m,flagId,action,body,user){
  if(!requireRole(user,['finance_manager','finance_analyst','ops_manager']))
    return R(403,{error:"صلاحية غير كافية"});

  if(m==="GET"&&!flagId){
    const r=await db.send(new ScanCommand({TableName:TABLES.fraudFlags,Limit:200}));
    const items=(r.Items||[]).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
    return R(200,{items,count:r.Count||0});
  }

  if(m==="GET"&&flagId){
    const f=await db.send(new GetCommand({TableName:TABLES.fraudFlags,Key:{id:flagId}}));
    return f.Item?R(200,f.Item):R(404,{error:"غير موجود"});
  }

  if(m==="POST"&&!flagId){
    const flag={
      id:'FRD-'+uid(),
      driver_id:body.driver_id,
      flag_type:body.flag_type||'anomaly',
      severity:body.severity||'medium',
      description:body.description||'',
      description_ar:body.description_ar||'',
      evidence:body.evidence||{},
      status:'open',
      created_by:user.email,
      created_at:new Date().toISOString()
    };
    await db.send(new PutCommand({TableName:TABLES.fraudFlags,Item:flag}));
    await auditLog('fraud_flag_created',user,{flag_id:flag.id,driver:body.driver_id,type:body.flag_type});
    return R(201,flag);
  }

  if(m==="POST"&&flagId&&action==="review"){
    const f=await db.send(new GetCommand({TableName:TABLES.fraudFlags,Key:{id:flagId}}));
    if(!f.Item)return R(404,{error:"غير موجود"});
    f.Item.status=body.status||'reviewed';
    f.Item.reviewed_by=user.email;
    f.Item.reviewed_at=new Date().toISOString();
    f.Item.review_notes=body.notes||'';
    f.Item.action_taken=body.action||'none';
    await db.send(new PutCommand({TableName:TABLES.fraudFlags,Item:f.Item}));
    await auditLog('fraud_flag_reviewed',user,{flag_id:flagId,action:body.action});
    return R(200,f.Item);
  }

  return R(405,{error:"Method not allowed"});
}

// ==========================================
// RULES — القواعد المالية
// ==========================================
async function handleRules(m,ruleType,ruleId,body,user){
  if(!requireRole(user,['finance_manager','finance_analyst']))
    return R(403,{error:"صلاحية غير كافية"});

  if(!ruleType){
    return R(200,{rule_types:['rate-cards','bonuses','penalties'],description:'Finance rules management'});
  }

  const table=ruleType==='rate-cards'?TABLES.rateCards:
              ruleType==='bonuses'?TABLES.bonusRules:
              ruleType==='penalties'?TABLES.penaltyRules:null;
  if(!table)return R(404,{error:"نوع قاعدة غير معروف: "+ruleType});

  if(m==="GET"){
    const r=await db.send(new ScanCommand({TableName:table,Limit:200}));
    return R(200,{items:r.Items||[],count:r.Count||0});
  }

  if(m==="POST"){
    if(!requireRole(user,['finance_manager']))
      return R(403,{error:"صلاحية غير كافية — يلزم finance_manager"});

    const rule={
      ...body,
      id:body.id||ruleType.toUpperCase().slice(0,3)+'-'+uid(),
      is_active:body.is_active!==false,
      created_by:user.email,
      created_at:new Date().toISOString(),
      version:(body.version||0)+1
    };
    await db.send(new PutCommand({TableName:table,Item:rule}));
    await auditLog('rule_created',user,{type:ruleType,rule_id:rule.id});
    return R(201,rule);
  }

  return R(405,{error:"Method not allowed"});
}

// ==========================================
// REPORTS — التقارير
// ==========================================
async function handleReports(m,reportType,body,user){
  if(!requireRole(user,['finance_manager','finance_analyst']))
    return R(403,{error:"صلاحية غير كافية"});

  if(m==="GET"&&reportType==="profitability"){
    // Basic profitability report from orders
    const orders=await db.send(new ScanCommand({TableName:TABLES.orders}));
    const allOrders=orders.Items||[];

    const byPlatform={};
    for(const o of allOrders){
      const p=o.platform||'unknown';
      if(!byPlatform[p])byPlatform[p]={platform:p,orders:0,gross:0,commission:0,net:0};
      byPlatform[p].orders++;
      byPlatform[p].gross+=parseFloat(o.amount||o.total||0);
    }

    return R(200,{platforms:Object.values(byPlatform),total_orders:allOrders.length,report_date:new Date().toISOString()});
  }

  if(m==="GET"&&reportType==="summary"){
    const[wallets,batches,adjustments,flags]=await Promise.all([
      db.send(new ScanCommand({TableName:TABLES.wallets,Select:"COUNT"})),
      db.send(new ScanCommand({TableName:TABLES.payoutBatches,Select:"COUNT"})),
      db.send(new ScanCommand({TableName:TABLES.adjustments,Select:"COUNT"})),
      db.send(new ScanCommand({TableName:TABLES.fraudFlags,Select:"COUNT"}))
    ]);
    return R(200,{
      wallets:wallets.Count||0,
      payout_batches:batches.Count||0,
      pending_adjustments:adjustments.Count||0,
      fraud_flags:flags.Count||0,
      timestamp:new Date().toISOString()
    });
  }

  return R(200,{available_reports:['profitability','summary']});
}

// ==========================================
// FEATURE FLAGS — أعلام الميزات
// ==========================================
async function handleFeatureFlags(m,body,user){
  if(!requireRole(user,['super_admin','SystemAdmin']))
    return R(403,{error:"صلاحية غير كافية — يلزم super_admin"});

  if(m==="GET"){
    const flags=[
      'FEATURE_FINANCE_ENGINE','FEATURE_AURORA_ENABLED','FEATURE_WALLET_LEDGER',
      'FEATURE_RECONCILIATION','FEATURE_FRAUD_DETECTION',
      'FEATURE_NECTED_ENABLED','FEATURE_N8N_ENABLED','FEATURE_VERI5NOW_ENABLED',
      'FEATURE_AI_FINANCE_INSIGHTS','FEATURE_TURIYA_ENABLED'
    ];
    const results={};
    for(const f of flags){
      try{
        const r=await db.send(new GetCommand({TableName:TABLES.settings,Key:{id:f}}));
        results[f]=r.Item?.enabled||false;
      }catch(e){results[f]=false;}
    }
    return R(200,{flags:results});
  }

  if(m==="POST"){
    if(!body.flag||body.enabled===undefined)
      return R(400,{error:"يلزم: flag, enabled"});
    await db.send(new PutCommand({TableName:TABLES.settings,Item:{
      id:body.flag,setting_key:'feature_flag',enabled:body.enabled,
      updated_by:user.email,updated_at:new Date().toISOString()
    }}));
    await auditLog('feature_flag_changed',user,{flag:body.flag,enabled:body.enabled});
    return R(200,{flag:body.flag,enabled:body.enabled});
  }

  return R(405,{error:"Method not allowed"});
}
