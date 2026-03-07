const{DynamoDBClient}=require("@aws-sdk/client-dynamodb");
const{DynamoDBDocumentClient,GetCommand,PutCommand,DeleteCommand,ScanCommand,QueryCommand}=require("@aws-sdk/lib-dynamodb");
const c=new DynamoDBClient({region:"me-south-1"});
const d=DynamoDBDocumentClient.from(c);
const T={drivers:"fll-drivers","staff-users":"fll-staff-users",complaints:"fll-complaints",vehicles:"fll-vehicles",departments:"fll-departments",roles:"fll-roles",permissions:"fll-permissions",notifications:"fll-notifications","audit-log":"fll-audit-log",approvals:"fll-approvals",tasks:"fll-tasks","payout-runs":"fll-payout-runs","payout-lines":"fll-payout-lines","accounting-rules":"fll-accounting-rules","driver-stats-daily":"fll-driver-stats-daily","vehicle-assignments":"fll-vehicle-assignments","email-logs":"fll-email-logs","rate-limits":"fll-rate-limits",counters:"fll-counters","system-settings":"fll-system-settings","user-profiles":"fll-user-profiles",orders:"fll-orders",users:"fll-users",invoices:"fll-invoices",shipments:"fll-shipments","fleet-requests":"fll-fleet-requests","dept-settings":"fll-dept-settings","driver-baseline":"fll-driver-baseline","risk-thresholds":"fll-risk-thresholds","complaint-messages":"fll-complaint-messages","complaint-transfers":"fll-complaint-transfers","users-auth":"fll-users-auth","account-reactivation-requests":"fll-account-reactivation-requests","email-change-requests":"fll-email-change-requests","verification-codes":"fll-verification-codes",attendance:"fll-attendance"};
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,Authorization,X-Amz-Date,X-Api-Key","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Content-Type":"application/json"};
const R=(s,b)=>({statusCode:s,headers:H,body:JSON.stringify(b)});
exports.handler=async(e)=>{
// Support both REST API v1 and HTTP API v2 event formats
const m=e.httpMethod||e.requestContext?.http?.method||"GET";
if(m==="OPTIONS")return R(200,{});
const rawPath=e.path||e.rawPath||"/";
const p=rawPath.split("/").filter(x=>x);
if(p[0]==="api")p.shift();
const res=p[0],pid=p[1]||null;
let body={};try{body=e.body?JSON.parse(e.body):{}}catch(x){}
if(!res)return R(200,{message:"FLL Platform API v2.1",status:"healthy",tables:Object.keys(T),timestamp:new Date().toISOString()});
if(res==="health")return R(200,{status:"healthy",region:"me-south-1",version:"2.1",tables:Object.keys(T).length});
// Stats endpoint for admin dashboard
if(res==="stats"){
try{
const stats={};
const tables=["drivers","orders","complaints","vehicles","staff-users","payout-runs","notifications","tasks"];
for(const t of tables){
const tn=T[t];
if(tn){const r=await d.send(new ScanCommand({TableName:tn,Select:"COUNT"}));stats[t]={count:r.Count||0}}
}
return R(200,{stats,timestamp:new Date().toISOString()});
}catch(err){return R(500,{error:err.message})}
}
const tn=T[res];
if(!tn)return R(404,{error:"Unknown resource: "+res,available:Object.keys(T)});
try{
if(m==="GET"){
if(pid){const r=await d.send(new GetCommand({TableName:tn,Key:{id:pid}}));return r.Item?R(200,r.Item):R(404,{error:"Not found"})}
// Support query params for filtering
const params={TableName:tn,Limit:100};
const qs=e.queryStringParameters||{};
if(qs.limit)params.Limit=Math.min(parseInt(qs.limit)||100,500);
if(qs.startKey)params.ExclusiveStartKey={id:qs.startKey};
const r=await d.send(new ScanCommand(params));
return R(200,{items:r.Items,count:r.Count,lastKey:r.LastEvaluatedKey?.id||null})
}
if(m==="POST"){const i=Object.assign({},body,{id:body.id||res+"-"+Date.now()+"-"+Math.random().toString(36).substr(2,6),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});await d.send(new PutCommand({TableName:tn,Item:i}));return R(201,i)}
if(m==="PUT"){if(!pid)return R(400,{error:"ID required"});const x=await d.send(new GetCommand({TableName:tn,Key:{id:pid}}));if(!x.Item)return R(404,{error:"Not found"});const u=Object.assign({},x.Item,body,{id:pid,updatedAt:new Date().toISOString()});await d.send(new PutCommand({TableName:tn,Item:u}));return R(200,u)}
if(m==="DELETE"){if(!pid)return R(400,{error:"ID required"});await d.send(new DeleteCommand({TableName:tn,Key:{id:pid}}));return R(200,{deleted:pid})}
return R(405,{error:"Method not allowed"});
}catch(err){return R(500,{error:err.message})}
};
