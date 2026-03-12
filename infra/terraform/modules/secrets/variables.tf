# =============================================================================
# GTCX Secrets Module — Variables
# =============================================================================

variable "environment" {
  description = "Environment name (e.g., zimbabwe-pilot, ghana-prod)"
  type        = string
}

variable "eks_cluster_name" {
  description = "EKS cluster name for IRSA trust policy"
  type        = string
}

variable "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN for IRSA trust policy"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
