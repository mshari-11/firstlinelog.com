const{DynamoDBClient}=require("@aws-sdk/client-dynamodb");
const{DynamoDBDocumentClient,GetCommand,PutCommand,DeleteCommand,ScanCommand,QueryCommand}=require("@aws-sdk/lib-dynamodb");
const c=new DynamoDBClient({region:"me-south-1"});
const d=DynamoDBDocumentClient.from(c);
const T={drivers:"fll-drivers","staff-users":"fll-staff-users",complaints:"fll-complaints",vehicles:"fll-vehicles",departments:"fll-departments",roles:"fll-roles",permissions:"fll-permissions",notifications:"fll-notifications","audit-log":"fll-audit-log",approvals:"fll-approvals",tasks:"fll-tasks","payout-runs":"fll-payout-runs","payout-lines":"fll-payout-lines","accounting-rules":"fll-accounting-rules","driver-stats-daily":"fll-driver-stats-daily","vehicle-assignments":"fll-vehicle-assignments","email-logs":"fll-email-logs","rate-limits":"fll-rate-limits",counters:"fll-counters","system-settings":"fll-system-settings","user-profiles":"fll-user-profiles",orders:"fll-orders",users:"fll-users",invoices:"fll-invoices",shipments:"fll-shipments","fleet-requests":"fll-fleet-requests","dept-settings":"fll-dept-settings","driver-baseline":"fll-driver-baseline","risk-thresholds":"fll-risk-thresholds","complaint-messages":"fll-complaint-messages","complaint-transfers":"fll-complaint-transfers","users-auth":"fll-users-auth","account-reactivation-requests":"fll-account-reactivation-requests","email-change-requests":"fll-email-change-requests","verification-codes":"fll-verification-codes",attendance:"fll-attendance"};
// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS=(process.env.ALLOWED_ORIGINS||"*").split(",").map(s=>s.trim());
function corsOrigin(e){
  const origin=(e.headers||{}).origin||(e.headers||{}).Origin||"";
  if(ALLOWED_ORIGINS.includes("*"))return "*";
  return ALLOWED_ORIGINS.includes(origin)?origin:ALLOWED_ORIGINS[0];
}
const baseH=(origin)=>({"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"Content-Type,Authorization,X-Amz-Date,X-Api-Key","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Content-Type":"application/json"});
let H=baseH("*");
const R=(s,b)=>({statusCode:s,headers:H,body:JSON.stringify(b)});

// ── Authorization ─────────────────────────────────────────────────────────────
const{CognitoJwtVerifier}=(() => { try { return require("aws-jwt-verify"); } catch { return { CognitoJwtVerifier: null }; } })();
const API_KEY=process.env.API_KEY||"";
const COGNITO_USER_POOL_ID=process.env.COGNITO_USER_POOL_ID||"";
const COGNITO_CLIENT_ID=process.env.COGNITO_CLIENT_ID||"";

let jwtVerifier=null;
if(CognitoJwtVerifier&&COGNITO_USER_POOL_ID&&COGNITO_CLIENT_ID){
  jwtVerifier=CognitoJwtVerifier.create({userPoolId:COGNITO_USER_POOL_ID,tokenUse:"access",clientId:COGNITO_CLIENT_ID});
}

async function authorize(e){
  const headers=e.headers||{};
  // Check X-Api-Key
  const apiKey=headers["x-api-key"]||headers["X-Api-Key"]||"";
  if(API_KEY&&apiKey===API_KEY)return{authorized:true,authType:"api-key"};
  // Check Authorization Bearer token
  const authHeader=headers.authorization||headers.Authorization||"";
  if(authHeader.startsWith("Bearer ")){
    const token=authHeader.slice(7);
    if(jwtVerifier){
      try{const payload=await jwtVerifier.verify(token);return{authorized:true,authType:"cognito-jwt",sub:payload.sub}}catch{return{authorized:false,error:"Invalid or expired token"}}
    }
    // If no Cognito verifier configured but API_KEY is set, reject bearer tokens
    if(API_KEY)return{authorized:false,error:"JWT verification not configured"};
  }
  // If neither API_KEY nor Cognito is configured, allow all (backwards-compatible until env vars are set)
  if(!API_KEY&&!jwtVerifier)return{authorized:true,authType:"none-configured"};
  return{authorized:false,error:"Missing Authorization header or X-Api-Key"};
}

// Public paths that don't require auth
const PUBLIC_PATHS=new Set(["","health","stats"]);

exports.handler=async(e)=>{
const m=e.httpMethod||e.requestContext?.http?.method||"GET";
// Set CORS origin per request
H=baseH(corsOrigin(e));
if(m==="OPTIONS")return R(200,{});
const rawPath=e.path||e.rawPath||"/";
const p=rawPath.split("/").filter(x=>x);

// Strip /api prefix
if(p[0]==="api")p.shift();

// ── Auth check (skip for public paths) ────────────────────────────────────────
const firstSegment=p[0]||"";
if(!PUBLIC_PATHS.has(firstSegment)){
  const auth=await authorize(e);
  if(!auth.authorized)return R(401,{error:"Unauthorized",message:auth.error||"Authentication required"});
}

// === DISPATCH ROUTES ===
if(p[0]==="dispatch"){
  p.shift();
  return handleDispatch(m,p,e);
}

// === FLEET ROUTES ===
if(p[0]==="fleet"){
  p.shift();
  return handleFleet(m,p,e);
}

// === COMPLAINTS ROUTES ===
if(p[0]==="complaints"){
  p.shift();
  return handleComplaints(m,p,e);
}

const res=p[0],pid=p[1]||null;
let body={};try{body=e.body?JSON.parse(e.body):{}}catch(x){}

if(!res)return R(200,{message:"FLL Platform API v2.2",status:"healthy",tables:Object.keys(T),timestamp:new Date().toISOString()});
if(res==="health")return R(200,{status:"healthy",region:"me-south-1",version:"2.2",tables:Object.keys(T).length});

if(res==="stats"){
try{
const stats={};
const tables=["drivers","orders","complaints","vehicles","staff-users","payout-runs","notifications","tasks"];
for(const t of tables){const tn=T[t];if(tn){const r=await d.send(new ScanCommand({TableName:tn,Select:"COUNT"}));stats[t]={count:r.Count||0}}}
return R(200,{stats,timestamp:new Date().toISOString()});
}catch(err){return R(500,{error:err.message})}
}

const tn=T[res];
if(!tn)return R(404,{error:"Unknown resource: "+res,available:Object.keys(T)});
try{
if(m==="GET"){
if(pid){const r=await d.send(new GetCommand({TableName:tn,Key:{id:pid}}));return r.Item?R(200,r.Item):R(404,{error:"Not found"})}
const params={TableName:tn,Limit:100};const qs=e.queryStringParameters||{};
if(qs.limit)params.Limit=Math.min(parseInt(qs.limit)||100,500);
if(qs.startKey)params.ExclusiveStartKey={id:qs.startKey};
const r=await d.send(new ScanCommand(params));
return R(200,{items:r.Items,count:r.Count,lastKey:r.LastEvaluatedKey?.id||null})
}
if(m==="POST"){const i={...body,id:body.id||res+"-"+Date.now()+"-"+Math.random().toString(36).substr(2,6),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:tn,Item:i}));return R(201,i)}
if(m==="PUT"){if(!pid)return R(400,{error:"ID required"});const x=await d.send(new GetCommand({TableName:tn,Key:{id:pid}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,...body,id:pid,updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:tn,Item:u}));return R(200,u)}
if(m==="DELETE"){if(!pid)return R(400,{error:"ID required"});await d.send(new DeleteCommand({TableName:tn,Key:{id:pid}}));return R(200,{deleted:pid})}
return R(405,{error:"Method not allowed"});
}catch(err){return R(500,{error:err.message})}
};

// ============ FLEET ============
async function handleFleet(m,p,e){
let body={};try{body=e.body?JSON.parse(e.body):{}}catch(x){}
const sub=p[0]||"",id=p[1]||null,action=p[2]||null;

if(sub==="stats"&&m==="GET"){
  try{
    const[vR,aR,dR]=await Promise.all([
      d.send(new ScanCommand({TableName:"fll-vehicles"})),
      d.send(new ScanCommand({TableName:"fll-vehicle-assignments",Select:"COUNT"})),
      d.send(new ScanCommand({TableName:"fll-drivers",Select:"COUNT"}))
    ]);
    const items=vR.Items||[];
    return R(200,{total_vehicles:items.length,available:items.filter(v=>v.status==="available"||v.status==="active").length,maintenance:items.filter(v=>v.status==="maintenance").length,assigned:items.filter(v=>v.status==="assigned").length,active_assignments:aR.Count||0,total_drivers:dR.Count||0});
  }catch(err){return R(500,{error:err.message})}
}

if(sub==="vehicles"){
  if(id==="available"&&m==="GET"){try{const r=await d.send(new ScanCommand({TableName:"fll-vehicles"}));const a=(r.Items||[]).filter(v=>v.status==="available"||v.status==="active");return R(200,{items:a,count:a.length})}catch(err){return R(500,{error:err.message})}}
  if(id&&m==="GET"){try{const r=await d.send(new GetCommand({TableName:"fll-vehicles",Key:{id}}));return r.Item?R(200,r.Item):R(404,{error:"Not found"})}catch(err){return R(500,{error:err.message})}}
  if(!id&&m==="GET"){try{const r=await d.send(new ScanCommand({TableName:"fll-vehicles",Limit:100}));return R(200,{items:r.Items,count:r.Count})}catch(err){return R(500,{error:err.message})}}
  if(m==="POST"&&!id){try{const i={...body,id:body.id||"veh-"+Date.now()+"-"+Math.random().toString(36).substr(2,6),status:body.status||"available",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-vehicles",Item:i}));return R(201,i)}catch(err){return R(500,{error:err.message})}}
  if(id&&m==="PUT"){try{const x=await d.send(new GetCommand({TableName:"fll-vehicles",Key:{id}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,...body,id,updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-vehicles",Item:u}));return R(200,u)}catch(err){return R(500,{error:err.message})}}
  if(id&&m==="DELETE"){try{await d.send(new DeleteCommand({TableName:"fll-vehicles",Key:{id}}));return R(200,{deleted:id})}catch(err){return R(500,{error:err.message})}}
  if(id&&action==="maintenance"&&m==="POST"){try{const x=await d.send(new GetCommand({TableName:"fll-vehicles",Key:{id}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,status:"maintenance",maintenanceNote:body.note||"",maintenanceDate:new Date().toISOString(),updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-vehicles",Item:u}));return R(200,u)}catch(err){return R(500,{error:err.message})}}
}

if(sub==="assignments"){
  if(!id&&m==="GET"){try{const r=await d.send(new ScanCommand({TableName:"fll-vehicle-assignments",Limit:100}));return R(200,{items:r.Items,count:r.Count})}catch(err){return R(500,{error:err.message})}}
  if(id==="driver"&&action){try{const r=await d.send(new ScanCommand({TableName:"fll-vehicle-assignments"}));const f=(r.Items||[]).filter(a=>a.driver_id===action);return R(200,{items:f,count:f.length})}catch(err){return R(500,{error:err.message})}}
  if(!id&&m==="POST"){try{const i={...body,id:body.id||"assign-"+Date.now()+"-"+Math.random().toString(36).substr(2,6),status:"active",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-vehicle-assignments",Item:i}));if(body.vehicle_id){const v=await d.send(new GetCommand({TableName:"fll-vehicles",Key:{id:body.vehicle_id}}));if(v.Item)await d.send(new PutCommand({TableName:"fll-vehicles",Item:{...v.Item,status:"assigned",updatedAt:new Date().toISOString()}}))}return R(201,i)}catch(err){return R(500,{error:err.message})}}
  if(id&&m==="PUT"){try{const x=await d.send(new GetCommand({TableName:"fll-vehicle-assignments",Key:{id}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,...body,id,updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-vehicle-assignments",Item:u}));return R(200,u)}catch(err){return R(500,{error:err.message})}}
  if(id&&action==="unassign"&&m==="POST"){try{const x=await d.send(new GetCommand({TableName:"fll-vehicle-assignments",Key:{id}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,status:"unassigned",unassignedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-vehicle-assignments",Item:u}));if(x.Item.vehicle_id){const v=await d.send(new GetCommand({TableName:"fll-vehicles",Key:{id:x.Item.vehicle_id}}));if(v.Item)await d.send(new PutCommand({TableName:"fll-vehicles",Item:{...v.Item,status:"available",updatedAt:new Date().toISOString()}}))}return R(200,u)}catch(err){return R(500,{error:err.message})}}
}

return R(404,{error:"Unknown fleet route",path:p});
}

// ============ COMPLAINTS ============
async function handleComplaints(m,p,e){
let body={};try{body=e.body?JSON.parse(e.body):{}}catch(x){}
const sub=p[0]||"",action=p[1]||null;

if(sub==="stats"&&m==="GET"){
  try{const r=await d.send(new ScanCommand({TableName:"fll-complaints"}));const items=r.Items||[];
  const cats={};items.forEach(c=>{const cat=c.category||"other";cats[cat]=(cats[cat]||0)+1});
  return R(200,{total:items.length,open:items.filter(c=>c.status==="open"||c.status==="new").length,in_progress:items.filter(c=>c.status==="in_progress"||c.status==="assigned").length,resolved:items.filter(c=>c.status==="resolved"||c.status==="closed").length,escalated:items.filter(c=>c.status==="escalated").length,by_category:cats})}catch(err){return R(500,{error:err.message})}
}
if(sub==="dept"&&action){try{const r=await d.send(new ScanCommand({TableName:"fll-complaints"}));const f=(r.Items||[]).filter(c=>c.department_id===action||c.dept_id===action);return R(200,{items:f,count:f.length})}catch(err){return R(500,{error:err.message})}}
if(sub&&m==="GET"&&sub!=="stats"&&sub!=="dept"){try{const r=await d.send(new GetCommand({TableName:"fll-complaints",Key:{id:sub}}));return r.Item?R(200,r.Item):R(404,{error:"Not found"})}catch(err){return R(500,{error:err.message})}}
if(!sub&&m==="GET"){try{const r=await d.send(new ScanCommand({TableName:"fll-complaints",Limit:100}));return R(200,{items:r.Items,count:r.Count})}catch(err){return R(500,{error:err.message})}}
if(!sub&&m==="POST"){try{const i={...body,id:body.id||"CMP-"+Date.now()+"-"+Math.random().toString(36).substr(2,4).toUpperCase(),status:"new",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-complaints",Item:i}));return R(201,i)}catch(err){return R(500,{error:err.message})}}
if(sub&&m==="PUT"){try{const x=await d.send(new GetCommand({TableName:"fll-complaints",Key:{id:sub}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,...body,id:sub,updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-complaints",Item:u}));return R(200,u)}catch(err){return R(500,{error:err.message})}}
if(sub&&action==="resolve"&&m==="POST"){try{const x=await d.send(new GetCommand({TableName:"fll-complaints",Key:{id:sub}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,status:"resolved",resolvedAt:new Date().toISOString(),resolvedBy:body.resolved_by||"system",resolution:body.resolution||"",updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-complaints",Item:u}));return R(200,u)}catch(err){return R(500,{error:err.message})}}
if(sub&&action==="assign"&&m==="POST"){try{const x=await d.send(new GetCommand({TableName:"fll-complaints",Key:{id:sub}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,status:"assigned",assigned_to:body.assigned_to||"",assignedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-complaints",Item:u}));return R(200,u)}catch(err){return R(500,{error:err.message})}}
if(sub&&action==="escalate"&&m==="POST"){try{const x=await d.send(new GetCommand({TableName:"fll-complaints",Key:{id:sub}}));if(!x.Item)return R(404,{error:"Not found"});const u={...x.Item,status:"escalated",escalatedAt:new Date().toISOString(),escalatedBy:body.escalated_by||"system",escalationReason:body.reason||"",updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-complaints",Item:u}));return R(200,u)}catch(err){return R(500,{error:err.message})}}
if(sub&&action==="transfer"&&m==="POST"){try{const x=await d.send(new GetCommand({TableName:"fll-complaints",Key:{id:sub}}));if(!x.Item)return R(404,{error:"Not found"});const xfer={id:"xfer-"+Date.now(),complaint_id:sub,from_dept:x.Item.department_id||"",to_dept:body.to_dept||"",reason:body.reason||"",transferredAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-complaint-transfers",Item:xfer}));const u={...x.Item,department_id:body.to_dept||x.Item.department_id,status:"transferred",updatedAt:new Date().toISOString()};await d.send(new PutCommand({TableName:"fll-complaints",Item:u}));return R(200,{complaint:u,transfer:xfer})}catch(err){return R(500,{error:err.message})}}

return R(404,{error:"Unknown complaints route",path:p});
}

// ============ DISPATCH ============
async function handleDispatch(m,p,e){
let body={};try{body=e.body?JSON.parse(e.body):{}}catch(x){}
const sub=p[0]||"",id=p[1]||null;

// GET /dispatch/available — available drivers only
if(sub==="available"&&m==="GET"){
  try{
    const r=await d.send(new ScanCommand({TableName:"fll-drivers"}));
    const available=(r.Items||[]).filter(dr=>dr.status==="available"||dr.status==="active");
    return R(200,{items:available,count:available.length});
  }catch(err){return R(500,{error:err.message})}
}

// GET /dispatch/active — active orders (pending + assigned + pickup + delivering)
if(sub==="active"&&m==="GET"){
  try{
    const r=await d.send(new ScanCommand({TableName:"fll-orders"}));
    const active=(r.Items||[]).filter(o=>["pending","assigned","pickup","delivering"].includes(o.status));
    return R(200,{items:active,count:active.length});
  }catch(err){return R(500,{error:err.message})}
}

// GET /dispatch/stats — dispatch overview
if(sub==="stats"&&m==="GET"){
  try{
    const[dR,oR]=await Promise.all([
      d.send(new ScanCommand({TableName:"fll-drivers"})),
      d.send(new ScanCommand({TableName:"fll-orders"}))
    ]);
    const drivers=dR.Items||[],orders=oR.Items||[];
    return R(200,{
      available_drivers:drivers.filter(dr=>dr.status==="available").length,
      busy_drivers:drivers.filter(dr=>dr.status==="busy").length,
      total_drivers:drivers.length,
      pending_orders:orders.filter(o=>o.status==="pending").length,
      active_orders:orders.filter(o=>["assigned","pickup","delivering"].includes(o.status)).length,
      delivered_today:orders.filter(o=>o.status==="delivered"&&o.updatedAt&&o.updatedAt.startsWith(new Date().toISOString().split("T")[0])).length,
    });
  }catch(err){return R(500,{error:err.message})}
}

// POST /dispatch/assign — assign order to driver (atomic: updates both order + driver)
if(sub==="assign"&&m==="POST"){
  const{order_id,driver_id}=body;
  if(!order_id||!driver_id)return R(400,{error:"order_id and driver_id required"});
  try{
    const[orderRes,driverRes]=await Promise.all([
      d.send(new GetCommand({TableName:"fll-orders",Key:{id:order_id}})),
      d.send(new GetCommand({TableName:"fll-drivers",Key:{id:driver_id}}))
    ]);
    if(!orderRes.Item)return R(404,{error:"Order not found"});
    if(!driverRes.Item)return R(404,{error:"Driver not found"});
    const now=new Date().toISOString();
    const updatedOrder={...orderRes.Item,status:"assigned",assignedDriverId:driver_id,assignedAt:now,updatedAt:now};
    const updatedDriver={...driverRes.Item,status:"busy",activeOrderId:order_id,updatedAt:now};
    await Promise.all([
      d.send(new PutCommand({TableName:"fll-orders",Item:updatedOrder})),
      d.send(new PutCommand({TableName:"fll-drivers",Item:updatedDriver}))
    ]);
    return R(200,{order:updatedOrder,driver:updatedDriver});
  }catch(err){return R(500,{error:err.message})}
}

// POST /dispatch/unassign — remove driver from order
if(sub==="unassign"&&m==="POST"){
  const{order_id}=body;
  if(!order_id)return R(400,{error:"order_id required"});
  try{
    const orderRes=await d.send(new GetCommand({TableName:"fll-orders",Key:{id:order_id}}));
    if(!orderRes.Item)return R(404,{error:"Order not found"});
    const driverId=orderRes.Item.assignedDriverId;
    const now=new Date().toISOString();
    const updatedOrder={...orderRes.Item,status:"pending",assignedDriverId:null,assignedAt:null,updatedAt:now};
    await d.send(new PutCommand({TableName:"fll-orders",Item:updatedOrder}));
    if(driverId){
      const driverRes=await d.send(new GetCommand({TableName:"fll-drivers",Key:{id:driverId}}));
      if(driverRes.Item){
        const updatedDriver={...driverRes.Item,status:"available",activeOrderId:null,updatedAt:now};
        await d.send(new PutCommand({TableName:"fll-drivers",Item:updatedDriver}));
      }
    }
    return R(200,{order:updatedOrder});
  }catch(err){return R(500,{error:err.message})}
}

// POST /dispatch/status — update order status + release driver on completion
if(sub==="status"&&m==="POST"){
  const{order_id,status}=body;
  if(!order_id||!status)return R(400,{error:"order_id and status required"});
  const validStatuses=["pending","assigned","pickup","delivering","delivered","cancelled"];
  if(!validStatuses.includes(status))return R(400,{error:"Invalid status",valid:validStatuses});
  try{
    const orderRes=await d.send(new GetCommand({TableName:"fll-orders",Key:{id:order_id}}));
    if(!orderRes.Item)return R(404,{error:"Order not found"});
    const now=new Date().toISOString();
    const updatedOrder={...orderRes.Item,status,updatedAt:now};
    if(status==="delivered")updatedOrder.deliveredAt=now;
    await d.send(new PutCommand({TableName:"fll-orders",Item:updatedOrder}));
    // Release driver on completion
    if((status==="delivered"||status==="cancelled")&&orderRes.Item.assignedDriverId){
      const driverRes=await d.send(new GetCommand({TableName:"fll-drivers",Key:{id:orderRes.Item.assignedDriverId}}));
      if(driverRes.Item){
        const updatedDriver={...driverRes.Item,status:"available",activeOrderId:null,updatedAt:now};
        await d.send(new PutCommand({TableName:"fll-drivers",Item:updatedDriver}));
      }
    }
    return R(200,{order:updatedOrder});
  }catch(err){return R(500,{error:err.message})}
}

return R(404,{error:"Unknown dispatch route",path:p});
}
