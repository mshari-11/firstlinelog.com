/**
 * FLL Tools Health Monitor v1.0
 * مراقب صحة التكاملات — فيرست لاين لوجستيكس
 *
 * Checks health of all integrated tools:
 * - Nected (rules engine)
 * - n8n (integration hub)
 * - Veri5now (eSign)
 * - Turiya AI (pilot)
 * - AWS services (DynamoDB, S3, Cognito, Bedrock)
 */

const{NectedAdapter}=require('./nected-adapter');
const{N8nAdapter}=require('./n8n-adapter');
const{Veri5nowAdapter}=require('./veri5now-adapter');
const{TuriyaAdapter}=require('./turiya-adapter');

async function checkAllHealth(){
  const nected=new NectedAdapter();
  const n8n=new N8nAdapter();
  const veri5now=new Veri5nowAdapter();
  const turiya=new TuriyaAdapter();

  const[nectedHealth,n8nHealth,veri5nowHealth,turiyaHealth]=await Promise.allSettled([
    nected.healthCheck(),
    n8n.healthCheck(),
    veri5now.healthCheck(),
    turiya.healthCheck()
  ]);

  return{
    timestamp:new Date().toISOString(),
    tools:{
      nected:{
        name:'Nected Rules Engine',
        name_ar:'محرك قواعد Nected',
        purpose:'Financial decisions: pricing, bonuses, penalties, approvals',
        ...(nectedHealth.status==='fulfilled'?nectedHealth.value:{status:'error',error:nectedHealth.reason?.message})
      },
      n8n:{
        name:'n8n Integration Hub',
        name_ar:'مركز تكاملات n8n',
        purpose:'External integrations: report ingestion, notifications, SFTP',
        ...(n8nHealth.status==='fulfilled'?n8nHealth.value:{status:'error',error:n8nHealth.reason?.message})
      },
      veri5now:{
        name:'Veri5now eSign',
        name_ar:'Veri5now للتوقيع الإلكتروني',
        purpose:'Document signing, contract management, onboarding',
        note:'Saudi eKYC NOT activated — eSign only',
        ...(veri5nowHealth.status==='fulfilled'?veri5nowHealth.value:{status:'error',error:veri5nowHealth.reason?.message})
      },
      turiya:{
        name:'Turiya AI (Pilot)',
        name_ar:'Turiya AI (تجريبي)',
        purpose:'Multi-agent copilot: finance insights, ops analysis, HR queries',
        note:'Read-only pilot — not in core finance path',
        ...(turiyaHealth.status==='fulfilled'?turiyaHealth.value:{status:'error',error:turiyaHealth.reason?.message})
      }
    }
  };
}

module.exports={checkAllHealth};
