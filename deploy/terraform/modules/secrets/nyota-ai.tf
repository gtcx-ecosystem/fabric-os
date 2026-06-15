# =============================================================================
# GTCX Secrets Module — nyota-ai staging (PayOps consumer)
# =============================================================================
# IRSA for ESO SecretStore — reads shared PayOps Stripe path only.
# =============================================================================

locals {
  nyota_ai_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "nyota-ai"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })
}

resource "aws_iam_policy" "nyota_ai_secrets_reader" {
  name        = "gtcx-${var.environment}-nyota-ai-secrets-reader"
  description = "Read nyota-ai PayOps secrets from AWS Secrets Manager (ESO)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      Resource = [
        aws_secretsmanager_secret.payops_stripe.arn,
      ]
    }]
  })

  tags = local.nyota_ai_tags
}

resource "aws_iam_role" "nyota_ai_secrets" {
  name = "gtcx-${var.environment}-nyota-ai-secrets-role"

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
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.nyota_ai_namespace}:${var.nyota_ai_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.nyota_ai_tags
}

resource "aws_iam_role_policy_attachment" "nyota_ai_secrets" {
  role       = aws_iam_role.nyota_ai_secrets.name
  policy_arn = aws_iam_policy.nyota_ai_secrets_reader.arn
}
