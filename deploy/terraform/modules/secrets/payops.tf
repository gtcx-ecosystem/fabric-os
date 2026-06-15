# =============================================================================
# GTCX Secrets Module — shared PayOps billing provider shells
# =============================================================================
# Shared Stripe / Flutterwave custody for fleet consumers (PAY-SUB-01).
# Values populated via platform/scripts/staging/populate-payops-staging-sm.sh
# =============================================================================

locals {
  payops_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "payops"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })

  payops_sm_prefix = "gtcx/shared/${var.environment}/payops"
}

resource "aws_secretsmanager_secret" "payops_stripe" {
  name        = "${local.payops_sm_prefix}/stripe"
  description = "Shared Stripe billing keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY)"

  tags = merge(local.payops_tags, {
    Name = "gtcx-${var.environment}-payops-stripe"
  })
}

resource "aws_secretsmanager_secret" "payops_flutterwave" {
  name        = "${local.payops_sm_prefix}/flutterwave"
  description = "Shared Flutterwave billing keys (FLUTTERWAVE_SECRET_KEY, FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_WEBHOOK_HASH)"

  tags = merge(local.payops_tags, {
    Name = "gtcx-${var.environment}-payops-flutterwave"
  })
}
