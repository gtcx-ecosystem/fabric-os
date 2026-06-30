# =============================================================================
# GTCX griot-ai Ingress Module — Variables
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "primary_domain" {
  description = "Primary griot-ai domain (e.g. griot.gtcx.trade)"
  type        = string
  default     = "griot.gtcx.trade"
}

variable "griot_ai_apex_domain" {
  description = "Apex domain for the primary griot-ai hosted zone (e.g. gtcx.trade)"
  type        = string
  default     = "gtcx.trade"
}

variable "dns_provider" {
  description = "Authoritative DNS provider for griot-ai records. Use cloudflare when gtcx.trade nameservers are delegated to Cloudflare."
  type        = string
  default     = "route53"

  validation {
    condition     = contains(["route53", "cloudflare"], lower(var.dns_provider))
    error_message = "dns_provider must be route53 or cloudflare."
  }
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for griot_ai_apex_domain. Leave empty to look it up with the Cloudflare provider."
  type        = string
  default     = ""
}

variable "include_gtcx_trade_san" {
  description = "Include griot.gtcx.trade as SAN on the ACM certificate (only useful when primary_domain is not already under gtcx.trade)"
  type        = bool
  default     = false
}

variable "gtcx_trade_apex_domain" {
  description = "Apex domain for gtcx.trade hosted zone"
  type        = string
  default     = "gtcx.trade"
}

variable "alb_dns_name" {
  description = "DNS name of the ALB created by the AWS Load Balancer Controller. Leave empty on first apply."
  type        = string
  default     = ""
}

variable "alb_zone_id" {
  description = "Hosted zone ID of the ALB. af-south-1: Z268VQBMOI5EKX. Leave empty on first apply."
  type        = string
  default     = ""
}

variable "wait_for_validation" {
  description = "Wait for ACM DNS validation to complete. Supported for Route53 mode; disable for Cloudflare mode to avoid long blocking applies."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
