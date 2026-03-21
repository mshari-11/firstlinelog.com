#!/usr/bin/env python3
"""
FLL Platform — AWS CDK Infrastructure as Code
Region: me-south-1 (Bahrain)
Account: 230811072086

Imports and manages all existing FLL resources + adds:
  - CloudWatch Alarms (all Lambdas, API Gateway, DynamoDB)
  - WAF (API Gateway protection)
  - Secrets Manager (migrate env vars)
"""

import aws_cdk as cdk

from stacks.monitoring_stack import FLLMonitoringStack
from stacks.waf_stack import FLLWafStack
from stacks.secrets_stack import FLLSecretsStack

app = cdk.App()

env = cdk.Environment(account="230811072086", region="me-south-1")

# Stack 1: Secrets Manager — migrate sensitive env vars
secrets = FLLSecretsStack(app, "fll-secrets", env=env)

# Stack 2: CloudWatch Alarms — monitoring all services
monitoring = FLLMonitoringStack(app, "fll-monitoring", env=env)

# Stack 3: WAF — protect API Gateway
waf = FLLWafStack(app, "fll-waf", env=env)

app.synth()
