# =============================================================================
# GTCX WORM Audit Storage Module
# =============================================================================
# S3-based Write Once Read Many (WORM) storage for audit events
# Object Lock in COMPLIANCE mode — cannot be overridden, even by root
# Per AUDITABLE principle (3): 7-year minimum retention, immutable, encrypted
# Per SOVEREIGN principle (6): Data stays in-region, optional cross-region replica
# =============================================================================

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "GTCX"
    Principle   = "AUDITABLE"
    Module      = "worm-audit"
  })

  enable_replication = var.replication_region != null
}

# -----------------------------------------------------------------------------
# Primary S3 Bucket — Object Lock (COMPLIANCE Mode)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "worm" {
  bucket              = "gtcx-${var.environment}-worm-audit"
  object_lock_enabled = true
  tags                = merge(local.common_tags, { Name = "gtcx-${var.environment}-worm-audit" })
}

resource "aws_s3_bucket_object_lock_configuration" "worm" {
  bucket = aws_s3_bucket.worm.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.retention_days
    }
  }
}

resource "aws_s3_bucket_versioning" "worm" {
  bucket = aws_s3_bucket.worm.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "worm" {
  bucket = aws_s3_bucket.worm.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.worm.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "worm" {
  bucket = aws_s3_bucket.worm.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "worm" {
  bucket = aws_s3_bucket.worm.id

  rule {
    id     = "worm-audit-lifecycle"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

# -----------------------------------------------------------------------------
# Bucket Policy — Deny Deletions (defense in depth beyond Object Lock)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_policy" "worm" {
  bucket = aws_s3_bucket.worm.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyObjectDeletion"
        Effect    = "Deny"
        Principal = "*"
        Action = [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion"
        ]
        Resource = "${aws_s3_bucket.worm.arn}/*"
      },
      {
        Sid       = "DenyBucketDeletion"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:DeleteBucket"
        Resource  = aws_s3_bucket.worm.arn
      },
      {
        Sid       = "EnforceSSLOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.worm.arn,
          "${aws_s3_bucket.worm.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# KMS Key — Customer-Managed, Auto-Rotating
# -----------------------------------------------------------------------------

resource "aws_kms_key" "worm" {
  description             = "GTCX ${var.environment} WORM audit encryption key"
  enable_key_rotation     = true
  deletion_window_in_days = 30

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "RootAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid    = "AllowS3Use"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "worm" {
  name          = "alias/gtcx-${var.environment}-worm-audit"
  target_key_id = aws_kms_key.worm.key_id
}

# -----------------------------------------------------------------------------
# Cross-Region Replication (conditional)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "replica" {
  count = local.enable_replication ? 1 : 0

  provider            = aws.replica
  bucket              = "gtcx-${var.environment}-worm-audit-replica"
  object_lock_enabled = true
  tags                = merge(local.common_tags, { Name = "gtcx-${var.environment}-worm-audit-replica" })
}

resource "aws_s3_bucket_versioning" "replica" {
  count = local.enable_replication ? 1 : 0

  provider = aws.replica
  bucket   = aws_s3_bucket.replica[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "replica" {
  count = local.enable_replication ? 1 : 0

  provider = aws.replica
  bucket   = aws_s3_bucket.replica[0].id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.retention_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "replica" {
  count = local.enable_replication ? 1 : 0

  provider = aws.replica
  bucket   = aws_s3_bucket.replica[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_role" "replication" {
  count = local.enable_replication ? 1 : 0

  name = "gtcx-${var.environment}-worm-audit-replication"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "replication" {
  count = local.enable_replication ? 1 : 0

  name = "gtcx-${var.environment}-worm-audit-replication-policy"
  role = aws_iam_role.replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.worm.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.worm.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replica[0].arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_replication_configuration" "worm" {
  count = local.enable_replication ? 1 : 0

  depends_on = [aws_s3_bucket_versioning.worm]

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.worm.id

  rule {
    id     = "worm-audit-replication"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.replica[0].arn
      storage_class = "STANDARD"
    }

    delete_marker_replication {
      status = "Disabled"
    }
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Alarm — Deletion Attempts
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "deletion_attempt" {
  alarm_name          = "gtcx-${var.environment}-worm-audit-deletion-attempt"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NumberOfObjects"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Detected deletion attempt against WORM audit bucket"
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.alarm_sns_topic_arns

  dimensions = {
    BucketName  = aws_s3_bucket.worm.id
    StorageType = "AllStorageTypes"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_metric_filter" "delete_attempts" {
  name           = "gtcx-${var.environment}-worm-audit-delete-attempts"
  pattern        = "{ ($.eventName = \"DeleteObject\") || ($.eventName = \"DeleteObjectVersion\") }"
  log_group_name = "aws-cloudtrail-logs-${data.aws_caller_identity.current.account_id}"

  metric_transformation {
    name          = "WormAuditDeleteAttempts"
    namespace     = "GTCX/AuditSecurity"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "delete_api_calls" {
  alarm_name          = "gtcx-${var.environment}-worm-audit-delete-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WormAuditDeleteAttempts"
  namespace           = "GTCX/AuditSecurity"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "DeleteObject API call detected against WORM audit bucket — investigate immediately"
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.alarm_sns_topic_arns

  tags = local.common_tags
}
