# =============================================================================
# GTCX Secrets Module — shared CommOps communications provider shells
# =============================================================================
# Shared SendGrid / Africa's Talking / Twilio custody for fleet consumers.
# Values populated via platform/scripts/staging/populate-commops-staging-sm.sh
# =============================================================================

locals {
  commops_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "commops"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })

  commops_sm_prefix = "gtcx/shared/${var.environment}/commops"
}

resource "aws_secretsmanager_secret" "commops_sendgrid" {
  name        = "${local.commops_sm_prefix}/sendgrid"
  description = "Shared SendGrid keys (SENDGRID_API_KEY, sendgrid_from_email)"

  tags = merge(local.commops_tags, {
    Name = "gtcx-${var.environment}-commops-sendgrid"
  })
}

resource "aws_secretsmanager_secret" "commops_africas_talking" {
  name        = "${local.commops_sm_prefix}/africas-talking"
  description = "Shared Africa's Talking SMS keys (africastalking_username, africastalking_api_key)"

  tags = merge(local.commops_tags, {
    Name = "gtcx-${var.environment}-commops-africas-talking"
  })
}

resource "aws_secretsmanager_secret" "commops_twilio" {
  name        = "${local.commops_sm_prefix}/twilio"
  description = "Shared Twilio keys (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)"

  tags = merge(local.commops_tags, {
    Name = "gtcx-${var.environment}-commops-twilio"
  })
}
