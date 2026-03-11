/**
 * FLL Nected Rules Engine Adapter v1.0
 * محول قواعد Nected — محرك القرارات المالية
 *
 * Purpose: Call Nected API for financial decisions
 * - Payout calculations
 * - Bonus eligibility
 * - Penalty assessment
 * - Approval routing
 *
 * Feature flag: FEATURE_NECTED_ENABLED
 * Required env: NECTED_API_URL, NECTED_API_KEY
 */

const NECTED_API_URL=process.env.NECTED_API_URL||'';
const NECTED_API_KEY=process.env.NECTED_API_KEY||'';

class NectedAdapter{
  constructor(){
    this.baseUrl=NECTED_API_URL;
    this.apiKey=NECTED_API_KEY;
    this.enabled=!!(this.baseUrl&&this.apiKey);
  }

  async callRule(ruleId,inputs){
    if(!this.enabled){
      return{success:false,error:'Nected not configured',fallback:true};
    }
    try{
      const res=await fetch(`${this.baseUrl}/api/v1/rules/${ruleId}/execute`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${this.apiKey}`
        },
        body:JSON.stringify({inputs})
      });
      if(!res.ok){
        const err=await res.text();
        return{success:false,error:`Nected API error: ${res.status}`,details:err};
      }
      const data=await res.json();
      return{success:true,result:data.result||data,metadata:{rule_id:ruleId,executed_at:new Date().toISOString()}};
    }catch(e){
      return{success:false,error:e.message,fallback:true};
    }
  }

  async callWorkflow(workflowId,inputs){
    if(!this.enabled){
      return{success:false,error:'Nected not configured',fallback:true};
    }
    try{
      const res=await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/execute`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${this.apiKey}`
        },
        body:JSON.stringify({inputs})
      });
      if(!res.ok)return{success:false,error:`Nected API error: ${res.status}`};
      const data=await res.json();
      return{success:true,result:data};
    }catch(e){
      return{success:false,error:e.message,fallback:true};
    }
  }

  // Calculate driver payout using Nected rule
  async calculatePayout(params){
    return this.callRule('payout-calculation',{
      platform_code:params.platform,
      city_code:params.city,
      contract_type:params.contract_type,
      vehicle_type:params.vehicle_type,
      ownership_type:params.ownership_type,
      gross_amount:params.gross_amount,
      order_count:params.order_count||1,
      report_date:params.report_date
    });
  }

  // Check bonus eligibility
  async checkBonusEligibility(params){
    return this.callRule('bonus-eligibility',{
      driver_id:params.driver_id,
      platform_code:params.platform,
      period_start:params.period_start,
      period_end:params.period_end,
      total_orders:params.total_orders,
      total_hours:params.total_hours||0,
      acceptance_rate:params.acceptance_rate||100
    });
  }

  // Assess penalties
  async assessPenalty(params){
    return this.callRule('penalty-assessment',{
      driver_id:params.driver_id,
      platform_code:params.platform,
      penalty_type:params.penalty_type,
      incident_date:params.incident_date,
      details:params.details||{}
    });
  }

  // Route approval to correct approver
  async routeApproval(params){
    return this.callRule('approval-routing',{
      request_type:params.request_type,
      amount:params.amount,
      requester_role:params.requester_role,
      department:params.department||'finance'
    });
  }

  // Health check
  async healthCheck(){
    if(!this.enabled)return{status:'not_configured',message:'NECTED_API_URL and NECTED_API_KEY required'};
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

module.exports={NectedAdapter};
