"""
FLL Secrets Stack — Migrate sensitive env vars to AWS Secrets Manager
"""

import json

from aws_cdk import (
    Stack,
    SecretValue,
    aws_secretsmanager as sm,
)
from constructs import Construct


class FLLSecretsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ── Main Platform Secret (consolidated) ──
        sm.Secret(
            self, "FLLPlatformSecrets",
            secret_name="fll-platform/prod/credentials",
            description="FLL Platform — all service credentials",
            generate_secret_string=sm.SecretStringGenerator(
                secret_string_template=json.dumps({
                    "SUPABASE_URL": "https://djebhztfewjfyyoortvv.supabase.co",
                    "SUPABASE_SERVICE_KEY": "REPLACE_WITH_ACTUAL_KEY",
                    "COGNITO_CLIENT_ID": "6n49ej8fl92i9rtotbk5o9o0d1",
                    "COGNITO_CLIENT_SECRET": "REPLACE_WITH_ACTUAL_SECRET",
                    "USER_POOL_ID": "me-south-1_aJtmQ0QrN",
                }),
                generate_string_key="rotation_token",
                exclude_punctuation=True,
            ),
        )

        # ── SES Email Config ──
        sm.Secret(
            self, "FLLEmailSecrets",
            secret_name="fll-platform/prod/email",
            description="FLL Platform — email service config",
            secret_string_value=SecretValue.unsafe_plain_text(json.dumps({
                "FROM_EMAIL": "FLL Platform <no-reply@fll.sa>",
                "ADMIN_EMAILS": "M.Z@FLL.SA,A.ALZAMIL@FLL.SA",
            })),
        )

        # ── KYC / Storage Config ──
        sm.Secret(
            self, "FLLStorageSecrets",
            secret_name="fll-platform/prod/storage",
            description="FLL Platform — S3 and storage config",
            secret_string_value=SecretValue.unsafe_plain_text(json.dumps({
                "KYC_BUCKET": "fll-kyc-documents-230811072086",
                "CHAT_TABLE": "fll-chat-history",
            })),
        )
