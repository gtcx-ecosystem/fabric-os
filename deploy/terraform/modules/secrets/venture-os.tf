# =============================================================================
# GTCX Secrets Module — venture-os staging (DEPLOY-02)
# =============================================================================
# IRSA for ESO SecretStore in venture-os-staging. Secret *values* are operator-
# populated in AWS SM; Terraform creates empty secret resources only.
# =============================================================================

locals {
  venture_os_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "venture-os"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })

  venture_os_sm_prefix = "gtcx/venture-os/${var.environment}"
}

# -----------------------------------------------------------------------------
# AWS Secrets Manager — venture-os secrets shell
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "venture_os_api_keys" {
  name        = "${local.venture_os_sm_prefix}/api-keys"
  description = "venture-os staging API keys bundle (VENTURE_WEBHOOK_SECRET, CLICKUP_*, LISTMONK_*)"

  tags = merge(local.venture_os_tags, {
    Name = "gtcx-${var.environment}-venture-os-api-keys"
  })
}

# -----------------------------------------------------------------------------
# IRSA — venture-os-sa → read staging SM paths
# -----------------------------------------------------------------------------

resource "aws_iam_policy" "venture_os_secrets_reader" {
  name        = "gtcx-${var.environment}-venture-os-secrets-reader"
  description = "Read venture-os secrets from AWS Secrets Manager (ESO)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      Resource = [
        aws_secretsmanager_secret.venture_os_api_keys.arn,
      ]
    }]
  })

  tags = local.venture_os_tags
}

resource "aws_iam_role" "venture_os_secrets" {
  name = "gtcx-${var.environment}-venture-os-secrets-role"

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
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.venture_os_namespace}:${var.venture_os_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.venture_os_tags
}

resource "aws_iam_role_policy_attachment" "venture_os_secrets" {
  role       = aws_iam_role.venture_os_secrets.name
  policy_arn = aws_iam_policy.venture_os_secrets_reader.arn
}
