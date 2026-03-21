"""
FLL WAF Stack — Web Application Firewall for API Gateway
Protects against: DDoS, SQL injection, XSS, bot traffic, rate abuse
"""

from aws_cdk import (
    Stack,
    aws_wafv2 as waf,
)
from constructs import Construct


class FLLWafStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # API Gateway ARNs to protect
        account = "230811072086"
        region = "me-south-1"
        api_arns = [
            f"arn:aws:apigateway:{region}::/restapis/xr7wsfym5k/stages/Prod",
            f"arn:aws:apigateway:{region}::/restapis/51n1gng40f/stages/Prod",
        ]

        # ── WAF Web ACL ──
        web_acl = waf.CfnWebACL(
            self, "FLLWebACL",
            name="fll-platform-waf",
            description="FLL Platform WAF — API Gateway Protection",
            scope="REGIONAL",
            default_action=waf.CfnWebACL.DefaultActionProperty(allow={}),
            visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name="fll-waf-metrics",
                sampled_requests_enabled=True,
            ),
            rules=[
                # Rule 1: Rate limiting — 2000 requests per 5 min per IP
                waf.CfnWebACL.RuleProperty(
                    name="fll-rate-limit",
                    priority=1,
                    action=waf.CfnWebACL.RuleActionProperty(block={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        rate_based_statement=waf.CfnWebACL.RateBasedStatementProperty(
                            limit=2000,
                            aggregate_key_type="IP",
                        ),
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="fll-rate-limit",
                        sampled_requests_enabled=True,
                    ),
                ),

                # Rule 2: Auth endpoints stricter rate limit — 100 per 5 min per IP
                waf.CfnWebACL.RuleProperty(
                    name="fll-auth-rate-limit",
                    priority=2,
                    action=waf.CfnWebACL.RuleActionProperty(block={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        rate_based_statement=waf.CfnWebACL.RateBasedStatementProperty(
                            limit=100,
                            aggregate_key_type="IP",
                            scope_down_statement=waf.CfnWebACL.StatementProperty(
                                byte_match_statement=waf.CfnWebACL.ByteMatchStatementProperty(
                                    search_string="/auth/",
                                    field_to_match=waf.CfnWebACL.FieldToMatchProperty(
                                        uri_path={},
                                    ),
                                    positional_constraint="STARTS_WITH",
                                    text_transformations=[
                                        waf.CfnWebACL.TextTransformationProperty(
                                            priority=0, type="LOWERCASE",
                                        ),
                                    ],
                                ),
                            ),
                        ),
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="fll-auth-rate-limit",
                        sampled_requests_enabled=True,
                    ),
                ),

                # Rule 3: AWS Managed — Common Rule Set (OWASP Top 10)
                waf.CfnWebACL.RuleProperty(
                    name="aws-common-rules",
                    priority=10,
                    override_action=waf.CfnWebACL.OverrideActionProperty(none={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet",
                        ),
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="aws-common-rules",
                        sampled_requests_enabled=True,
                    ),
                ),

                # Rule 4: AWS Managed — SQL Injection Protection
                waf.CfnWebACL.RuleProperty(
                    name="aws-sqli-rules",
                    priority=20,
                    override_action=waf.CfnWebACL.OverrideActionProperty(none={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesSQLiRuleSet",
                        ),
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="aws-sqli-rules",
                        sampled_requests_enabled=True,
                    ),
                ),

                # Rule 5: AWS Managed — Known Bad Inputs
                waf.CfnWebACL.RuleProperty(
                    name="aws-bad-inputs",
                    priority=30,
                    override_action=waf.CfnWebACL.OverrideActionProperty(none={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesKnownBadInputsRuleSet",
                        ),
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="aws-bad-inputs",
                        sampled_requests_enabled=True,
                    ),
                ),

                # Rule 6: AWS Managed — Bot Control
                waf.CfnWebACL.RuleProperty(
                    name="aws-bot-control",
                    priority=40,
                    override_action=waf.CfnWebACL.OverrideActionProperty(none={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesBotControlRuleSet",
                            managed_rule_group_configs=[
                                waf.CfnWebACL.ManagedRuleGroupConfigProperty(
                                    aws_managed_rules_bot_control_rule_set=waf.CfnWebACL.AWSManagedRulesBotControlRuleSetProperty(
                                        inspection_level="COMMON",
                                    ),
                                ),
                            ],
                        ),
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="aws-bot-control",
                        sampled_requests_enabled=True,
                    ),
                ),

                # Rule 7: Block requests > 8KB body (except file upload endpoints)
                waf.CfnWebACL.RuleProperty(
                    name="fll-body-size-limit",
                    priority=50,
                    action=waf.CfnWebACL.RuleActionProperty(block={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        and_statement=waf.CfnWebACL.AndStatementProperty(
                            statements=[
                                waf.CfnWebACL.StatementProperty(
                                    size_constraint_statement=waf.CfnWebACL.SizeConstraintStatementProperty(
                                        field_to_match=waf.CfnWebACL.FieldToMatchProperty(body={}),
                                        comparison_operator="GT",
                                        size=8192,
                                        text_transformations=[
                                            waf.CfnWebACL.TextTransformationProperty(
                                                priority=0, type="NONE",
                                            ),
                                        ],
                                    ),
                                ),
                                waf.CfnWebACL.StatementProperty(
                                    not_statement=waf.CfnWebACL.NotStatementProperty(
                                        statement=waf.CfnWebACL.StatementProperty(
                                            byte_match_statement=waf.CfnWebACL.ByteMatchStatementProperty(
                                                search_string="/upload",
                                                field_to_match=waf.CfnWebACL.FieldToMatchProperty(
                                                    uri_path={},
                                                ),
                                                positional_constraint="CONTAINS",
                                                text_transformations=[
                                                    waf.CfnWebACL.TextTransformationProperty(
                                                        priority=0, type="LOWERCASE",
                                                    ),
                                                ],
                                            ),
                                        ),
                                    ),
                                ),
                            ],
                        ),
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="fll-body-size-limit",
                        sampled_requests_enabled=True,
                    ),
                ),

                # Rule 8: Geo restriction — allow only Saudi Arabia + nearby
                waf.CfnWebACL.RuleProperty(
                    name="fll-geo-restrict",
                    priority=60,
                    action=waf.CfnWebACL.RuleActionProperty(block={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        not_statement=waf.CfnWebACL.NotStatementProperty(
                            statement=waf.CfnWebACL.StatementProperty(
                                geo_match_statement=waf.CfnWebACL.GeoMatchStatementProperty(
                                    country_codes=[
                                        "SA",  # Saudi Arabia
                                        "AE",  # UAE
                                        "BH",  # Bahrain
                                        "KW",  # Kuwait
                                        "QA",  # Qatar
                                        "OM",  # Oman
                                        "EG",  # Egypt
                                        "JO",  # Jordan
                                    ],
                                ),
                            ),
                        ),
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="fll-geo-restrict",
                        sampled_requests_enabled=True,
                    ),
                ),
            ],
        )

        # ── Associate WAF with API Gateways ──
        for i, api_arn in enumerate(api_arns):
            waf.CfnWebACLAssociation(
                self, f"FLLWafAssoc{i}",
                resource_arn=api_arn,
                web_acl_arn=web_acl.attr_arn,
            )
