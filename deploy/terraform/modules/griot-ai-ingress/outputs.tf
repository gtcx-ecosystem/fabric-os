# =============================================================================
# GTCX griot-ai Ingress Module — Outputs
# =============================================================================

output "certificate_arn" {
  description = "ACM certificate ARN for griot-ai primary domain"
  value       = aws_acm_certificate.griot_ai.arn
}

output "certificate_domain_validation" {
  description = "DNS validation records for ACM certificate"
  value = [
    for dvo in aws_acm_certificate.griot_ai.domain_validation_options : {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  ]
}

output "dns_provider" {
  description = "Authoritative DNS provider used for griot-ai records"
  value       = local.dns_provider
}

output "griot_ai_zone_id" {
  description = "Route53 hosted zone ID for the primary griot-ai apex domain"
  value       = local.use_route53 ? data.aws_route53_zone.griot_ai[0].zone_id : ""
}

output "gtcx_trade_zone_id" {
  description = "Route53 hosted zone ID for gtcx.trade"
  value       = local.use_route53 && var.include_gtcx_trade_san ? data.aws_route53_zone.gtcx_trade[0].zone_id : ""
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID used for griot-ai DNS records"
  value       = local.cloudflare_zone_id
}

output "cloudflare_validation_records_created" {
  description = "Whether ACM validation records are managed in Cloudflare"
  value       = local.use_cloudflare
}

output "service_dns_record_created" {
  description = "Whether the service DNS record is wired to the ALB"
  value       = local.create_route53_a_record || local.create_cloudflare_cname
}
