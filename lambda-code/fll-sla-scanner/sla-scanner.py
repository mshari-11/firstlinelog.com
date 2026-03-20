import json,boto3,os,time
from datetime import datetime,timedelta
ddb=boto3.resource('dynamodb',region_name='me-south-1')
ses=boto3.client('ses',region_name='me-south-1')
def handler(event,context):
 ct=ddb.Table(os.environ.get('COMPLAINTS_TABLE','fll-complaints'))
 nt=ddb.Table(os.environ.get('NOTIFICATIONS_TABLE','fll-notifications'))
 ds=ddb.Table(os.environ.get('DEPT_SETTINGS_TABLE','fll-dept-settings'))
 now=datetime.utcnow();results={'reminded':0,'escalated':0}
 complaints=ct.scan(FilterExpression='#s IN (:o,:p)',ExpressionAttributeNames={'#s':'status'},ExpressionAttributeValues={':o':'open',':p':'in_progress'}).get('Items',[])
 settings={};
 for s in ds.scan().get('Items',[]):settings[s['dept']]=s
 for c in complaints:
  dept=c.get('department','operations');cfg=settings.get(dept,{});sla24=int(cfg.get('sla24Hours',24));sla48=int(cfg.get('sla48Hours',48))
  last=c.get('lastStaffResponseAt',c.get('createdAt',''));
  try:last_dt=datetime.fromisoformat(last.replace('Z','+00:00').replace('+00:00',''))
  except:continue
  hours=(now-last_dt).total_seconds()/3600
  if hours>=sla48 and not c.get('escalated48'):
   nt.put_item(Item={'notificationId':str(__import__('uuid').uuid4()),'recipientSub':'MSHARI_SUB','type':'complaint_escalated','payload':json.dumps({'complaintId':c.get('complaintId',''),'dept':dept,'hours':int(hours)}),  'channel':'in_app','createdAt':now.isoformat()})
   nt.put_item(Item={'notificationId':str(__import__('uuid').uuid4()),'recipientSub':'AHMED_SUB','type':'complaint_escalated','payload':json.dumps({'complaintId':c.get('complaintId',''),'dept':dept,'hours':int(hours)}),'channel':'in_app','createdAt':now.isoformat()})
   ct.update_item(Key={'complaintId':c['complaintId']},UpdateExpression='SET escalated48=:t,escalatedAt=:n',ExpressionAttributeValues={':t':True,':n':now.isoformat()})
   try:ses.send_email(Source='no-reply@fll.sa',Destination={'ToAddresses':['m_shaikhi@yahoo.com']},Message={'Subject':{'Data':f'تصعيد شكوى - {c.get("complaintId","")[:8]}'},'Body':{'Text':{'Data':f'شكوى تجاوزت {sla48} ساعة بدون حل. القسم: {dept}'}}})
   except:pass
   results['escalated']+=1
  elif hours>=sla24 and not c.get('reminded24'):
   assignee=c.get('assignedTo',cfg.get('defaultAssigneeSub',''))
   if assignee:nt.put_item(Item={'notificationId':str(__import__('uuid').uuid4()),'recipientSub':assignee,'type':'complaint_reminder','payload':json.dumps({'complaintId':c.get('complaintId',''),'dept':dept,'hours':int(hours)}),'channel':'in_app','createdAt':now.isoformat()})
   ct.update_item(Key={'complaintId':c['complaintId']},UpdateExpression='SET reminded24=:t,remindedAt=:n',ExpressionAttributeValues={':t':True,':n':now.isoformat()})
   try:ses.send_email(Source='no-reply@fll.sa',Destination={'ToAddresses':[f'{assignee}@fll.sa']},Message={'Subject':{'Data':f'تذكير شكوى - {c.get("complaintId","")[:8]}'},'Body':{'Text':{'Data':f'شكوى مر عليها {sla24} ساعة. الرجاء المتابعة.'}}})
   except:pass
   results['reminded']+=1
 return {'statusCode':200,'body':json.dumps(results)}
