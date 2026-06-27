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

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
