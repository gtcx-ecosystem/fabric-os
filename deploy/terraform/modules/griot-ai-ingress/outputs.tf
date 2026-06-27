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

output "griot_ai_zone_id" {
  description = "Route53 hosted zone ID for the primary griot-ai apex domain"
  value       = data.aws_route53_zone.griot_ai.zone_id
}

output "gtcx_trade_zone_id" {
  description = "Route53 hosted zone ID for gtcx.trade"
  value       = var.include_gtcx_trade_san ? data.aws_route53_zone.gtcx_trade[0].zone_id : ""
}
