"""
FLL Monitoring Stack — CloudWatch Alarms for all services
"""

from aws_cdk import (
    Duration,
    Stack,
    aws_cloudwatch as cw,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subs,
)
from constructs import Construct


class FLLMonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ── SNS Topic for Alarm Notifications ──
        alarm_topic = sns.Topic(
            self, "FLLAlarmTopic",
            topic_name="fll-alarm-notifications",
            display_name="FLL Platform Alerts",
        )
        alarm_topic.add_subscription(subs.EmailSubscription("M.Z@FLL.SA"))
        alarm_topic.add_subscription(subs.EmailSubscription("A.ALZAMIL@FLL.SA"))

        alarm_action = cw_actions.SnsAction(alarm_topic)

        # ── Lambda Function Alarms ──
        lambda_functions = [
            # (name, error_threshold, duration_threshold_ms, timeout_s)
            ("fll-auth-api", 5, 10000, 30),
            ("fll-otp-service", 5, 10000, 30),
            ("fll-driver-onboarding", 3, 15000, 30),
            ("fll-kyc-upload", 3, 15000, 30),
            ("fll-ai-chatbot", 3, 30000, 60),
            ("fll-ai-finance-api", 3, 15000, 30),
            ("fll-ai-finance-review", 2, 150000, 300),
            ("fll-ai-dashboard-api", 3, 10000, 15),
            ("fll-data-sync", 2, 240000, 300),
            ("fll-contact-confirm", 3, 10000, 30),
            ("fll-user-management", 3, 10000, 30),
            ("fll-sla-scanner", 3, 30000, 60),
            ("fll-generate-stc-excel", 3, 30000, 60),
            ("fll-db-migration", 1, 600000, 900),
            ("fll-platform-api-prod", 5, 15000, 30),
            ("fll-complaints-classifier-prod", 3, 30000, 60),
        ]

        for func_name, err_thresh, dur_thresh, timeout in lambda_functions:
            safe_id = func_name.replace("-", "")

            # Error alarm
            cw.Alarm(
                self, f"{safe_id}Errors",
                alarm_name=f"fll-{func_name}-errors",
                alarm_description=f"Lambda {func_name} errors > {err_thresh} in 5 min",
                metric=cw.Metric(
                    namespace="AWS/Lambda",
                    metric_name="Errors",
                    dimensions_map={"FunctionName": func_name},
                    statistic="Sum",
                    period=Duration.minutes(5),
                ),
                threshold=err_thresh,
                evaluation_periods=1,
                comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(alarm_action)

            # Duration alarm (approaching timeout)
            cw.Alarm(
                self, f"{safe_id}Duration",
                alarm_name=f"fll-{func_name}-duration",
                alarm_description=f"Lambda {func_name} p95 duration > {dur_thresh}ms",
                metric=cw.Metric(
                    namespace="AWS/Lambda",
                    metric_name="Duration",
                    dimensions_map={"FunctionName": func_name},
                    statistic="p95",
                    period=Duration.minutes(5),
                ),
                threshold=dur_thresh,
                evaluation_periods=2,
                comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(alarm_action)

            # Throttle alarm
            cw.Alarm(
                self, f"{safe_id}Throttles",
                alarm_name=f"fll-{func_name}-throttles",
                alarm_description=f"Lambda {func_name} throttled",
                metric=cw.Metric(
                    namespace="AWS/Lambda",
                    metric_name="Throttles",
                    dimensions_map={"FunctionName": func_name},
                    statistic="Sum",
                    period=Duration.minutes(5),
                ),
                threshold=1,
                evaluation_periods=1,
                comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(alarm_action)

        # ── API Gateway Alarms ──
        api_gateways = [
            ("xr7wsfym5k", "fll-platform-api-prod"),
            ("51n1gng40f", "fll-ai-dashboard"),
        ]

        for api_id, api_name in api_gateways:
            safe_id = api_name.replace("-", "")

            # 5xx errors
            cw.Alarm(
                self, f"{safe_id}5xx",
                alarm_name=f"fll-{api_name}-5xx",
                alarm_description=f"API {api_name} 5xx errors > 10 in 5 min",
                metric=cw.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="5xx",
                    dimensions_map={"ApiId": api_id},
                    statistic="Sum",
                    period=Duration.minutes(5),
                ),
                threshold=10,
                evaluation_periods=1,
                comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(alarm_action)

            # 4xx errors (high rate indicates abuse)
            cw.Alarm(
                self, f"{safe_id}4xx",
                alarm_name=f"fll-{api_name}-4xx",
                alarm_description=f"API {api_name} 4xx errors > 100 in 5 min",
                metric=cw.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="4xx",
                    dimensions_map={"ApiId": api_id},
                    statistic="Sum",
                    period=Duration.minutes(5),
                ),
                threshold=100,
                evaluation_periods=2,
                comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(alarm_action)

            # Latency
            cw.Alarm(
                self, f"{safe_id}Latency",
                alarm_name=f"fll-{api_name}-latency",
                alarm_description=f"API {api_name} p95 latency > 5s",
                metric=cw.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="Latency",
                    dimensions_map={"ApiId": api_id},
                    statistic="p95",
                    period=Duration.minutes(5),
                ),
                threshold=5000,
                evaluation_periods=2,
                comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(alarm_action)

        # ── DynamoDB Alarms (key tables) ──
        dynamo_tables = [
            "fll-users",
            "fll-users-auth",
            "fll-drivers",
            "fll-orders",
            "fll-finance-ledger",
            "fll-chat-history",
        ]

        for table_name in dynamo_tables:
            safe_id = table_name.replace("-", "")

            # Read throttle
            cw.Alarm(
                self, f"{safe_id}ReadThrottle",
                alarm_name=f"fll-{table_name}-read-throttle",
                alarm_description=f"DynamoDB {table_name} read throttled",
                metric=cw.Metric(
                    namespace="AWS/DynamoDB",
                    metric_name="ReadThrottleEvents",
                    dimensions_map={"TableName": table_name},
                    statistic="Sum",
                    period=Duration.minutes(5),
                ),
                threshold=5,
                evaluation_periods=1,
                comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(alarm_action)

            # Write throttle
            cw.Alarm(
                self, f"{safe_id}WriteThrottle",
                alarm_name=f"fll-{table_name}-write-throttle",
                alarm_description=f"DynamoDB {table_name} write throttled",
                metric=cw.Metric(
                    namespace="AWS/DynamoDB",
                    metric_name="WriteThrottleEvents",
                    dimensions_map={"TableName": table_name},
                    statistic="Sum",
                    period=Duration.minutes(5),
                ),
                threshold=5,
                evaluation_periods=1,
                comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(alarm_action)

        # ── Billing Alarm ──
        cw.Alarm(
            self, "BillingAlarm",
            alarm_name="fll-monthly-billing",
            alarm_description="FLL monthly AWS cost > $500",
            metric=cw.Metric(
                namespace="AWS/Billing",
                metric_name="EstimatedCharges",
                dimensions_map={"Currency": "USD"},
                statistic="Maximum",
                period=Duration.hours(6),
            ),
            threshold=500,
            evaluation_periods=1,
            comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cw.TreatMissingData.NOT_BREACHING,
        ).add_alarm_action(alarm_action)
