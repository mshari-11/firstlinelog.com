import json
import os
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cognito = boto3.client('cognito-idp', region_name='me-south-1')
ses = boto3.client('ses', region_name='me-south-1')

USER_POOL_ID = os.environ.get('USER_POOL_ID')
if not USER_POOL_ID:
    logger.error("USER_POOL_ID environment variable is not set")

def lambda_handler(event, context):
    """معالج إدارة المستخدمين"""
    
    try:
        action = event.get('action')
        
        if action == 'add_user_to_group':
            return add_user_to_group(event)
        elif action == 'approve_staff_user':
            return approve_staff_user(event)
        elif action == 'get_pending_users':
            return get_pending_users()
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'إجراء غير صحيح'})
            }
            
    except Exception as e:
        logger.error(f"خطأ في معالج المستخدمين: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'حدث خطأ داخلي'})
        }

def add_user_to_group(event):
    """إضافة مستخدم إلى مجموعة"""
    username = event.get('username')
    group_name = event.get('group_name')
    
    if not username or not group_name:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'اسم المستخدم والمجموعة مطلوبان'})
        }
    
    try:
        cognito.admin_add_user_to_group(
            UserPoolId=USER_POOL_ID,
            Username=username,
            GroupName=group_name
        )
        
        logger.info(f"تم إضافة {username} إلى مجموعة {group_name}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'تم إضافة المستخدم إلى مجموعة {group_name}',
                'username': username,
                'group': group_name
            })
        }
        
    except Exception as e:
        logger.error(f"خطأ في إضافة المستخدم للمجموعة: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'حدث خطأ داخلي'})
        }

def approve_staff_user(event):
    """الموافقة على موظف جديد"""
    username = event.get('username')
    department = event.get('department', 'staff')
    
    try:
        # تأكيد المستخدم
        cognito.admin_confirm_sign_up(
            UserPoolId=USER_POOL_ID,
            Username=username
        )
        
        # إضافة للمجموعة المناسبة
        cognito.admin_add_user_to_group(
            UserPoolId=USER_POOL_ID,
            Username=username,
            GroupName=department
        )
        
        # الحصول على بيانات المستخدم لإرسال بريد
        user_data = cognito.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=username
        )
        
        email = None
        for attr in user_data['UserAttributes']:
            if attr['Name'] == 'email':
                email = attr['Value']
                break
        
        # إرسال بريد موافقة
        if email:
            send_approval_email(email, username, department)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'تم قبول الموظف بنجاح',
                'username': username,
                'department': department
            })
        }
        
    except Exception as e:
        logger.error(f"خطأ في الموافقة على الموظف: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'حدث خطأ داخلي'})
        }

def get_pending_users():
    """الحصول على المستخدمين المعلقين"""
    try:
        response = cognito.list_users(
            UserPoolId=USER_POOL_ID,
            Filter='cognito:user_status = "UNCONFIRMED"'
        )
        
        pending_users = []
        for user in response['Users']:
            user_data = {
                'username': user['Username'],
                'created_date': user['UserCreateDate'].isoformat(),
                'user_status': user['UserStatus']
            }
            
            # استخراج الخصائص
            for attr in user['Attributes']:
                if attr['Name'] in ['email', 'name', 'custom:user_type']:
                    user_data[attr['Name'].replace('custom:', '')] = attr['Value']
            
            pending_users.append(user_data)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'pending_users': pending_users,
                'count': len(pending_users)
            })
        }
        
    except Exception as e:
        logger.error(f"خطأ في الحصول على المستخدمين المعلقين: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'حدث خطأ داخلي'})
        }

def send_approval_email(email, username, department):
    """إرسال بريد الموافقة"""
    try:
        subject = "تم قبول طلب التوظيف - FLL"
        
        body = f"""
        مرحباً {username}،
        
        تم قبول طلب التوظيف الخاص بك في الخط الأول للخدمات اللوجستية.
        
        القسم: {department}
        اسم المستخدم: {username}
        
        يمكنك الآن تسجيل الدخول على:
        https://www.fll.sa/login
        
        مرحباً بك في فريق FLL!
        """
        
        ses.send_email(
            Source='no-reply@fll.sa',
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Text': {'Data': body, 'Charset': 'UTF-8'}
                }
            }
        )
        
        logger.info(f"تم إرسال بريد الموافقة إلى {email}")
        
    except Exception as e:
        logger.error(f"خطأ في إرسال بريد الموافقة: {str(e)}")
