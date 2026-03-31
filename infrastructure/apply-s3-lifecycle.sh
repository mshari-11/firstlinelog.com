#!/bin/bash
# Apply S3 lifecycle + intelligent tiering to KYC documents bucket
# Run: bash infrastructure/apply-s3-lifecycle.sh

BUCKET="fll-kyc-documents-230811072086"
REGION="me-south-1"

echo "⏳ Applying lifecycle policy to $BUCKET..."

aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "ArchiveOldDocuments",
        "Status": "Enabled",
        "Filter": {},
        "Transitions": [
          { "Days": 30, "StorageClass": "STANDARD_IA" },
          { "Days": 90, "StorageClass": "GLACIER" },
          { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
        ]
      },
      {
        "ID": "CleanupOldVersions",
        "Status": "Enabled",
        "Filter": {},
        "NoncurrentVersionTransitions": [
          { "NoncurrentDays": 30, "StorageClass": "GLACIER" }
        ],
        "NoncurrentVersionExpiration": {
          "NoncurrentDays": 365
        }
      }
    ]
  }'

echo "✅ Lifecycle policy applied"

echo "⏳ Enabling Intelligent-Tiering on $BUCKET..."

aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --id "KYCAutoTiering" \
  --intelligent-tiering-configuration '{
    "Id": "KYCAutoTiering",
    "Status": "Enabled",
    "Tierings": [
      { "AccessTier": "ARCHIVE_ACCESS", "Days": 90 },
      { "AccessTier": "DEEP_ARCHIVE_ACCESS", "Days": 180 }
    ]
  }'

echo "✅ Intelligent-Tiering enabled"
echo ""
echo "📊 Storage tiers:"
echo "  0-30 days  → STANDARD (instant access)"
echo "  30-90 days → STANDARD_IA (cheaper, millisecond access)"
echo "  90-365 days → GLACIER (archive, 3-5 hours to restore)"
echo "  365+ days  → DEEP_ARCHIVE (cheapest, 12 hours to restore)"
echo "  Old versions → GLACIER after 30 days, deleted after 1 year"
