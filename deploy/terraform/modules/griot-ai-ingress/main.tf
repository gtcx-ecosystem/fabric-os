# =============================================================================
# GTCX griot-ai Ingress Module
# =============================================================================
# Provisions ACM certificate + DNS records for griot-ai public endpoints.
#
# Endpoint:
#   - <primary_domain> under gtcx.trade (e.g. griot.gtcx.trade)
#
# Two-apply pattern:
#   1. First apply with alb_dns_name = "" creates ACM cert + validation records.
#   2. Deploy K8s Ingress (griot-ai-staging/griot-api); ALB controller creates ALB.
#   3. Set alb_dns_name + alb_zone_id from kubectl output; second apply creates
#      the service DNS record for <primary_domain>.
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Module      = "griot-ai-ingress"
    Service     = "griot-ai"
  })

  dns_provider            = lower(var.dns_provider)
  use_route53             = local.dns_provider == "route53"
  use_cloudflare          = local.dns_provider == "cloudflare"
  san_domains             = var.include_gtcx_trade_san ? ["griot.${var.gtcx_trade_apex_domain}"] : []
  all_domains             = concat([var.primary_domain], local.san_domains)
  validation_options      = { for dvo in aws_acm_certificate.griot_ai.domain_validation_options : dvo.domain_name => dvo }
  create_route53_a_record = local.use_route53 && var.alb_dns_name != "" && var.alb_zone_id != ""
  create_cloudflare_cname = local.use_cloudflare && var.alb_dns_name != ""
  cloudflare_zone_id = local.use_cloudflare ? (
    var.cloudflare_zone_id != ""
    ? var.cloudflare_zone_id
    : data.cloudflare_zones.griot_ai[0].zones[0].id
  ) : ""
  validation_record_fqdns = concat(
    [for r in aws_route53_record.griot_ai_validation : r.fqdn],
    [for r in aws_route53_record.gtcx_trade_validation : r.fqdn],
  )
}

# -----------------------------------------------------------------------------
# Hosted Zone Lookups
# -----------------------------------------------------------------------------

data "aws_route53_zone" "griot_ai" {
  count        = local.use_route53 ? 1 : 0
  name         = "${var.griot_ai_apex_domain}."
  private_zone = false
}

data "aws_route53_zone" "gtcx_trade" {
  count        = local.use_route53 && var.include_gtcx_trade_san ? 1 : 0
  name         = "${var.gtcx_trade_apex_domain}."
  private_zone = false
}

data "cloudflare_zones" "griot_ai" {
  count = local.use_cloudflare && var.cloudflare_zone_id == "" ? 1 : 0

  filter {
    name = var.griot_ai_apex_domain
  }
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
# Route53 Validation Records — primary apex zone
# -----------------------------------------------------------------------------

resource "aws_route53_record" "griot_ai_validation" {
  for_each = local.use_route53 ? {
    for domain_name, dvo in local.validation_options : domain_name => dvo
    if endswith(dvo.domain_name, var.griot_ai_apex_domain)
  } : {}

  zone_id = data.aws_route53_zone.griot_ai[0].zone_id
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
  for_each = local.use_route53 && var.include_gtcx_trade_san ? {
    for domain_name, dvo in local.validation_options : domain_name => dvo
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
# Route53 A Record — primary domain → ALB
# -----------------------------------------------------------------------------

resource "aws_route53_record" "griot_ai_a" {
  count = local.create_route53_a_record ? 1 : 0

  zone_id = data.aws_route53_zone.griot_ai[0].zone_id
  name    = var.primary_domain
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = false
  }
}

# -----------------------------------------------------------------------------
# Cloudflare Validation Records — authoritative when gtcx.trade uses Cloudflare
# -----------------------------------------------------------------------------

resource "cloudflare_record" "griot_ai_validation" {
  for_each = local.use_cloudflare ? local.validation_options : {}

  zone_id         = local.cloudflare_zone_id
  name            = trimsuffix(each.value.resource_record_name, ".")
  type            = each.value.resource_record_type
  value           = trimsuffix(each.value.resource_record_value, ".")
  ttl             = 60
  proxied         = false
  allow_overwrite = true
}

# -----------------------------------------------------------------------------
# Cloudflare CNAME Record — primary domain → ALB
# -----------------------------------------------------------------------------

resource "cloudflare_record" "griot_ai_cname" {
  count = local.create_cloudflare_cname ? 1 : 0

  zone_id         = local.cloudflare_zone_id
  name            = var.primary_domain
  type            = "CNAME"
  value           = trimsuffix(var.alb_dns_name, ".")
  ttl             = 60
  proxied         = false
  allow_overwrite = true
}

# -----------------------------------------------------------------------------
# ACM Certificate Validation
# -----------------------------------------------------------------------------

resource "aws_acm_certificate_validation" "griot_ai" {
  count = var.wait_for_validation && local.use_route53 ? 1 : 0

  certificate_arn         = aws_acm_certificate.griot_ai.arn
  validation_record_fqdns = local.validation_record_fqdns
}
