/**
 * FLL n8n Integration Hub Adapter v1.0
 * محول n8n — مركز التكاملات الخارجية
 *
 * Purpose: Trigger n8n workflows for external integrations
 * - Platform report ingestion triggers
 * - Email/SMS notifications
 * - External API webhooks
 * - SFTP report fetching
 *
 * Feature flag: FEATURE_N8N_ENABLED
 * Required env: N8N_WEBHOOK_BASE_URL, N8N_API_KEY
 */

const N8N_WEBHOOK_BASE_URL=process.env.N8N_WEBHOOK_BASE_URL||'';
const N8N_API_KEY=process.env.N8N_API_KEY||'';

class N8nAdapter{
  constructor(){
    this.baseUrl=N8N_WEBHOOK_BASE_URL;
    this.apiKey=N8N_API_KEY;
    this.enabled=!!(this.baseUrl);
  }

  async triggerWebhook(webhookPath,payload){
    if(!this.enabled)return{success:false,error:'n8n not configured',fallback:true};
    try{
      const headers={'Content-Type':'application/json'};
      if(this.apiKey)headers['Authorization']=`Bearer ${this.apiKey}`;
      const res=await fetch(`${this.baseUrl}/${webhookPath}`,{
        method:'POST',headers,body:JSON.stringify(payload)
      });
      if(!res.ok)return{success:false,error:`n8n webhook error: ${res.status}`};
      const data=await res.json().catch(()=>({}));
      return{success:true,result:data};
    }catch(e){
      return{success:false,error:e.message,fallback:true};
    }
  }

  // Trigger platform report ingestion
  async triggerReportIngestion(params){
    return this.triggerWebhook('fll/report-ingestion',{
      platform_code:params.platform_code,
      report_date:params.report_date,
      s3_bucket:params.s3_bucket||'fll-ops-raw',
      s3_key:params.s3_key,
      file_type:params.file_type||'csv',
      uploaded_by:params.uploaded_by
    });
  }

  // Send notification via n8n
  async sendNotification(params){
    return this.triggerWebhook('fll/notification',{
      channel:params.channel||'email',
      to:params.to,
      subject:params.subject,
      body:params.body,
      template:params.template||'generic',
      metadata:params.metadata||{}
    });
  }

  // Trigger payout export
  async triggerPayoutExport(params){
    return this.triggerWebhook('fll/payout-export',{
      batch_id:params.batch_id,
      payment_method:params.payment_method||'stc_bank',
      export_format:params.export_format||'excel',
      triggered_by:params.triggered_by
    });
  }

  // Fetch platform report via SFTP
  async triggerSftpFetch(params){
    return this.triggerWebhook('fll/sftp-fetch',{
      platform_code:params.platform_code,
      date_range:{start:params.start_date,end:params.end_date},
      target_bucket:'fll-ops-raw'
    });
  }

  // Health check
  async healthCheck(){
    if(!this.enabled)return{status:'not_configured',message:'N8N_WEBHOOK_BASE_URL required'};
    try{
      const res=await fetch(`${this.baseUrl}/fll/health`,{method:'GET'});
      return{status:res.ok?'healthy':'unhealthy',statusCode:res.status};
    }catch(e){
      return{status:'unreachable',error:e.message};
    }
  }
}

module.exports={N8nAdapter};
