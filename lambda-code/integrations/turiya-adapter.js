/**
 * FLL Turiya AI Adapter v1.0
 * محول Turiya AI — طبقة التنسيق متعددة الوكلاء (تجريبي)
 *
 * Purpose: Multi-agent orchestration for copilot features
 * - Finance copilot (read-only insights)
 * - Ops copilot (operational analysis)
 * - HR assistant (employee queries)
 *
 * IMPORTANT: This is a PILOT integration.
 * - Feature flag: FEATURE_TURIYA_ENABLED (default: false)
 * - READ-ONLY access only — no writes to finance tables
 * - Not in core finance path
 *
 * Required env: TURIYA_API_URL, TURIYA_API_KEY
 */

const TURIYA_API_URL=process.env.TURIYA_API_URL||'';
const TURIYA_API_KEY=process.env.TURIYA_API_KEY||'';

class TuriyaAdapter{
  constructor(){
    this.baseUrl=TURIYA_API_URL;
    this.apiKey=TURIYA_API_KEY;
    this.enabled=!!(this.baseUrl&&this.apiKey);
  }

  async apiCall(path,payload){
    if(!this.enabled)return{success:false,error:'Turiya AI not configured (pilot feature)',fallback:true};
    try{
      const res=await fetch(`${this.baseUrl}${path}`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${this.apiKey}`
        },
        body:JSON.stringify(payload)
      });
      if(!res.ok)return{success:false,error:`Turiya API error: ${res.status}`};
      const data=await res.json();
      return{success:true,result:data};
    }catch(e){
      return{success:false,error:e.message,fallback:true};
    }
  }

  // Finance copilot — read-only financial analysis
  async financeCopilot(query,context){
    return this.apiCall('/api/v1/agents/finance-copilot',{
      query,
      context:{...context,mode:'read_only'},
      constraints:{
        no_writes:true,
        data_access:['views','aggregates'],
        max_response_tokens:2000
      }
    });
  }

  // Ops copilot — operational analysis
  async opsCopilot(query,context){
    return this.apiCall('/api/v1/agents/ops-copilot',{
      query,
      context:{...context,mode:'read_only'},
      constraints:{no_writes:true}
    });
  }

  // HR assistant
  async hrAssistant(query,context){
    return this.apiCall('/api/v1/agents/hr-assistant',{
      query,
      context:{...context,mode:'read_only'},
      constraints:{no_writes:true}
    });
  }

  // Health check
  async healthCheck(){
    if(!this.enabled)return{status:'not_configured',message:'TURIYA_API_URL and TURIYA_API_KEY required (pilot feature — disabled by default)'};
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

module.exports={TuriyaAdapter};
