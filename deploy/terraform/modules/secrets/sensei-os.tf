# =============================================================================
# GTCX Secrets Module — sensei-os staging (PayOps consumer)
# =============================================================================
# IRSA for ESO SecretStore — reads shared PayOps Stripe path only.
# Full app deployment remains sensei-os owner; fabric provides secrets substrate.
# =============================================================================

locals {
  sensei_os_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "sensei-os"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })
}

resource "aws_iam_policy" "sensei_os_secrets_reader" {
  name        = "gtcx-${var.environment}-sensei-os-secrets-reader"
  description = "Read sensei-os PayOps secrets from AWS Secrets Manager (ESO)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      Resource = [
        aws_secretsmanager_secret.payops_flutterwave.arn,
        aws_secretsmanager_secret.payops_stripe.arn,
      ]
    }]
  })

  tags = local.sensei_os_tags
}

resource "aws_iam_role" "sensei_os_secrets" {
  name = "gtcx-${var.environment}-sensei-os-secrets-role"

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
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.sensei_os_namespace}:${var.sensei_os_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.sensei_os_tags
}

resource "aws_iam_role_policy_attachment" "sensei_os_secrets" {
  role       = aws_iam_role.sensei_os_secrets.name
  policy_arn = aws_iam_policy.sensei_os_secrets_reader.arn
}
