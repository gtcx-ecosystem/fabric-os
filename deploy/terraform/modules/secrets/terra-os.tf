# =============================================================================
# GTCX Secrets Module — terra-os staging (INF-TERRA-02..04)
# =============================================================================
# IRSA for ESO SecretStore in terraos namespace. Secret values operator-populated
# in AWS SM (terraos/staging/*); Terraform creates shells only.
# =============================================================================

locals {
  terra_os_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "terra-os"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })

  terra_os_sm_prefix = "terraos/staging"
}

resource "aws_secretsmanager_secret" "terra_os_ghcr_pull" {
  name        = "${local.terra_os_sm_prefix}/ghcr-pull-token"
  description = "GHCR pull token (.dockerconfigjson) for terra-os staging"

  tags = merge(local.terra_os_tags, {
    Name = "gtcx-${var.environment}-terraos-ghcr-pull"
  })
}

resource "aws_secretsmanager_secret" "terra_os_rds" {
  name        = "${local.terra_os_sm_prefix}/rds"
  description = "terra-os staging RDS connection (url, password)"

  tags = merge(local.terra_os_tags, {
    Name = "gtcx-${var.environment}-terraos-rds"
  })
}

resource "aws_secretsmanager_secret" "terra_os_redis" {
  name        = "${local.terra_os_sm_prefix}/redis"
  description = "terra-os staging Redis connection (url, password)"

  tags = merge(local.terra_os_tags, {
    Name = "gtcx-${var.environment}-terraos-redis"
  })
}

resource "aws_iam_policy" "terra_os_secrets_reader" {
  name        = "gtcx-${var.environment}-terraos-secrets-reader"
  description = "Read terra-os secrets from AWS Secrets Manager (ESO)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      Resource = [
        aws_secretsmanager_secret.terra_os_ghcr_pull.arn,
        aws_secretsmanager_secret.terra_os_rds.arn,
        aws_secretsmanager_secret.terra_os_redis.arn,
        "arn:aws:secretsmanager:*:*:secret:${local.terra_os_sm_prefix}/app-secrets*",
        aws_secretsmanager_secret.commops_sendgrid.arn,
        aws_secretsmanager_secret.commops_africas_talking.arn,
      ]
    }]
  })

  tags = local.terra_os_tags
}

resource "aws_iam_role" "terra_os_secrets" {
  name = "gtcx-${var.environment}-terraos-secrets-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.terra_os_namespace}:${var.terra_os_eso_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.terra_os_tags
}

resource "aws_iam_role_policy_attachment" "terra_os_secrets" {
  role       = aws_iam_role.terra_os_secrets.name
  policy_arn = aws_iam_policy.terra_os_secrets_reader.arn
}
