# =============================================================================
# GTCX griot-ai Ingress Module
# =============================================================================
# Provisions ACM certificate + Route53 records for griot-ai public endpoints.
#
# Endpoints:
#   - api.griot.ai (primary)
#   - griot.gtcx.trade (SAN, optional)
#
# Two-apply pattern:
#   1. First apply with alb_dns_name = "" creates ACM cert + validation records.
#   2. Deploy K8s Ingress (griot-ai-staging/griot-api); ALB controller creates ALB.
#   3. Set alb_dns_name + alb_zone_id from kubectl output; second apply creates
#      the A record for api.griot.ai.
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Module      = "griot-ai-ingress"
    Service     = "griot-ai"
  })

  san_domains   = var.include_gtcx_trade_san ? ["griot.${var.gtcx_trade_apex_domain}"] : []
  all_domains   = concat([var.primary_domain], local.san_domains)
  create_a_record = var.alb_dns_name != "" && var.alb_zone_id != ""
}

# -----------------------------------------------------------------------------
# Hosted Zone Lookups
# -----------------------------------------------------------------------------

data "aws_route53_zone" "griot_ai" {
  name         = "${var.griot_ai_apex_domain}."
  private_zone = false
}

data "aws_route53_zone" "gtcx_trade" {
  count        = var.include_gtcx_trade_san ? 1 : 0
  name         = "${var.gtcx_trade_apex_domain}."
  private_zone = false
}

# -----------------------------------------------------------------------------
# ACM Certificate
# -----------------------------------------------------------------------------

resource "aws_acm_certificate" "griot_ai" {
  domain_name       = var.primary_domain
  validation_method = "DNS"

  subject_alternative_names = local.san_domains

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-griot-ai-cert"
  })
}

# -----------------------------------------------------------------------------
# Route53 Validation Records — griot.ai zone
# -----------------------------------------------------------------------------

resource "aws_route53_record" "griot_ai_validation" {
  for_each = {
    for dvo in aws_acm_certificate.griot_ai.domain_validation_options : dvo.domain_name => dvo
    if endswith(dvo.domain_name, var.griot_ai_apex_domain)
  }

  zone_id = data.aws_route53_zone.griot_ai.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  records = [each.value.resource_record_value]
  ttl     = 60

  allow_overwrite = true
}

# -----------------------------------------------------------------------------
# Route53 Validation Records — gtcx.trade zone (SAN)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "gtcx_trade_validation" {
  for_each = var.include_gtcx_trade_san ? {
    for dvo in aws_acm_certificate.griot_ai.domain_validation_options : dvo.domain_name => dvo
    if endswith(dvo.domain_name, var.gtcx_trade_apex_domain)
  } : {}

  zone_id = data.aws_route53_zone.gtcx_trade[0].zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  records = [each.value.resource_record_value]
  ttl     = 60

  allow_overwrite = true
}

# -----------------------------------------------------------------------------
# Route53 A Record — api.griot.ai → ALB
# -----------------------------------------------------------------------------

resource "aws_route53_record" "griot_ai_a" {
  count = local.create_a_record ? 1 : 0

  zone_id = data.aws_route53_zone.griot_ai.zone_id
  name    = var.primary_domain
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = false
  }
}

# -----------------------------------------------------------------------------
# ACM Certificate Validation
# -----------------------------------------------------------------------------

resource "aws_acm_certificate_validation" "griot_ai" {
  certificate_arn = aws_acm_certificate.griot_ai.arn

  validation_record_fqdns = concat(
    [for r in aws_route53_record.griot_ai_validation : r.fqdn],
    [for r in aws_route53_record.gtcx_trade_validation : r.fqdn],
  )
}
