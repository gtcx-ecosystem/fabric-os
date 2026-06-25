# =============================================================================
# GTCX griot-ai Ingress Module — Variables
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "primary_domain" {
  description = "Primary griot-ai domain (e.g. api.griot.ai)"
  type        = string
  default     = "api.griot.ai"
}

variable "griot_ai_apex_domain" {
  description = "Apex domain for griot-ai hosted zone"
  type        = string
  default     = "griot.ai"
}

variable "include_gtcx_trade_san" {
  description = "Include griot.gtcx.trade as SAN on the ACM certificate"
  type        = bool
  default     = true
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
