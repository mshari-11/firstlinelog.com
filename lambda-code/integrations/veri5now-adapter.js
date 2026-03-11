/**
 * FLL Veri5now Adapter v1.0
 * محول Veri5now — التوقيع الإلكتروني وإدارة العقود
 *
 * Purpose: eSign and contract management for driver onboarding
 * - Document signing (contracts, agreements)
 * - Contract status tracking
 * - Webhook handling for status updates
 *
 * NOTE: Saudi eKYC NOT activated — awaiting vendor confirmation.
 *       This adapter covers eSign/onboarding only.
 *
 * Feature flag: FEATURE_VERI5NOW_ENABLED
 * Required env: VERI5NOW_API_URL, VERI5NOW_API_KEY
 */

const VERI5NOW_API_URL=process.env.VERI5NOW_API_URL||'';
const VERI5NOW_API_KEY=process.env.VERI5NOW_API_KEY||'';

class Veri5nowAdapter{
  constructor(){
    this.baseUrl=VERI5NOW_API_URL;
    this.apiKey=VERI5NOW_API_KEY;
    this.enabled=!!(this.baseUrl&&this.apiKey);
  }

  async apiCall(method,path,body){
    if(!this.enabled)return{success:false,error:'Veri5now not configured',fallback:true};
    try{
      const opts={
        method,
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${this.apiKey}`,
          'X-Api-Key':this.apiKey
        }
      };
      if(body)opts.body=JSON.stringify(body);
      const res=await fetch(`${this.baseUrl}${path}`,opts);
      if(!res.ok)return{success:false,error:`Veri5now API error: ${res.status}`};
      const data=await res.json().catch(()=>({}));
      return{success:true,result:data};
    }catch(e){
      return{success:false,error:e.message,fallback:true};
    }
  }

  // Create a document signing request
  async createSigningRequest(params){
    return this.apiCall('POST','/api/v1/esign/create',{
      document_name:params.document_name,
      document_type:params.document_type||'employment_contract',
      signers:[{
        name:params.signer_name,
        email:params.signer_email,
        phone:params.signer_phone,
        role:'driver'
      }],
      template_id:params.template_id,
      fields:params.fields||{},
      callback_url:params.callback_url,
      expiry_days:params.expiry_days||7,
      language:'ar',
      metadata:{
        driver_id:params.driver_id,
        contract_type:params.contract_type,
        source:'fll-hr'
      }
    });
  }

  // Get signing request status
  async getSigningStatus(requestId){
    return this.apiCall('GET',`/api/v1/esign/${requestId}/status`);
  }

  // Download signed document
  async downloadSignedDocument(requestId){
    return this.apiCall('GET',`/api/v1/esign/${requestId}/download`);
  }

  // List all signing requests
  async listSigningRequests(filters){
    const params=new URLSearchParams(filters||{}).toString();
    return this.apiCall('GET',`/api/v1/esign/list${params?'?'+params:''}`);
  }

  // Handle webhook from Veri5now (status updates)
  processWebhook(payload){
    const event=payload.event||payload.type;
    const data=payload.data||payload;
    return{
      event,
      request_id:data.request_id||data.id,
      status:data.status,
      signer:data.signer||{},
      signed_at:data.signed_at||data.completed_at,
      document_url:data.document_url,
      metadata:data.metadata||{}
    };
  }

  // Health check
  async healthCheck(){
    if(!this.enabled)return{status:'not_configured',message:'VERI5NOW_API_URL and VERI5NOW_API_KEY required'};
    try{
      const res=await fetch(`${this.baseUrl}/api/v1/health`,{
        headers:{'Authorization':`Bearer ${this.apiKey}`}
      });
      return{status:res.ok?'healthy':'unhealthy',statusCode:res.status};
    }catch(e){
      return{status:'unreachable',error:e.message};
    }
  }
}

module.exports={Veri5nowAdapter};
