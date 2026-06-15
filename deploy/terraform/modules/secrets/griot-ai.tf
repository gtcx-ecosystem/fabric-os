# =============================================================================
# GTCX Secrets Module — griot-ai staging (PayOps consumer)
# =============================================================================

locals {
  griot_ai_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "griot-ai"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })
}

resource "aws_iam_policy" "griot_ai_secrets_reader" {
  name        = "gtcx-${var.environment}-griot-ai-secrets-reader"
  description = "Read griot-ai PayOps secrets from AWS Secrets Manager (ESO)"

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

  tags = local.griot_ai_tags
}

resource "aws_iam_role" "griot_ai_secrets" {
  name = "gtcx-${var.environment}-griot-ai-secrets-role"

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
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.griot_ai_namespace}:${var.griot_ai_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.griot_ai_tags
}

resource "aws_iam_role_policy_attachment" "griot_ai_secrets" {
  role       = aws_iam_role.griot_ai_secrets.name
  policy_arn = aws_iam_policy.griot_ai_secrets_reader.arn
}
