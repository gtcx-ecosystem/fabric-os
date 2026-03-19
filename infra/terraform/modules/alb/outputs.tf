# =============================================================================
# ALB Module — Outputs
# =============================================================================

output "controller_role_arn" {
  description = "IAM role ARN for the ALB controller"
  value       = aws_iam_role.alb_controller.arn
}

output "certificate_arn" {
  description = "ACM certificate ARN (empty if no domain_name provided)"
  value       = length(aws_acm_certificate.api) > 0 ? aws_acm_certificate.api[0].arn : ""
}

output "certificate_domain_validation" {
  description = "DNS validation records for ACM certificate"
  value = length(aws_acm_certificate.api) > 0 ? [
    for dvo in aws_acm_certificate.api[0].domain_validation_options : {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  ] : []
}
