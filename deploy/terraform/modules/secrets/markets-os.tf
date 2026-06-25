# =============================================================================
# GTCX Secrets Module — markets-os staging (PROD-READY-005)
# =============================================================================
# IRSA for ESO SecretStore in markets-os-staging. Secret *values* are operator-
# populated in AWS SM; Terraform creates empty secret resources only.
# =============================================================================

locals {
  markets_os_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "markets-os"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })

  markets_os_sm_prefix = "gtcx/markets-os/${var.environment}"
}

# -----------------------------------------------------------------------------
# AWS Secrets Manager — markets-os staging API secrets shell
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "markets_os_api_keys" {
  name        = "${local.markets_os_sm_prefix}/api-keys"
  description = "markets-os staging API keys bundle (POSTGRES_PASSWORD, AUTH_JWT_SECRET, INTERNAL_SERVICE_TOKEN, ANTHROPIC_API_KEY)"

  tags = merge(local.markets_os_tags, {
    Name = "gtcx-${var.environment}-markets-os-api-keys"
  })
}

# -----------------------------------------------------------------------------
# IRSA — markets-os-sa → read staging SM paths
# -----------------------------------------------------------------------------

resource "aws_iam_policy" "markets_os_secrets_reader" {
  name        = "gtcx-${var.environment}-markets-os-secrets-reader"
  description = "Read markets-os secrets from AWS Secrets Manager (ESO)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      Resource = [
        aws_secretsmanager_secret.markets_os_api_keys.arn,
      ]
    }]
  })

  tags = local.markets_os_tags
}

resource "aws_iam_role" "markets_os_secrets" {
  name = "gtcx-${var.environment}-markets-os-secrets-role"

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
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.markets_os_namespace}:${var.markets_os_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.markets_os_tags
}

resource "aws_iam_role_policy_attachment" "markets_os_secrets" {
  role       = aws_iam_role.markets_os_secrets.name
  policy_arn = aws_iam_policy.markets_os_secrets_reader.arn
}
