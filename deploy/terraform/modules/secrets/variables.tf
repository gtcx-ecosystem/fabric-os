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

variable "intelligence_namespace" {
  description = "Kubernetes namespace for intelligence service account"
  type        = string
  default     = "intelligence"
}

variable "intelligence_service_account" {
  description = "Kubernetes service account name for intelligence pods"
  type        = string
  default     = "intelligence-sa"
}

variable "compliance_os_namespace" {
  description = "Kubernetes namespace for compliance-os ESO (Hub #17)"
  type        = string
  default     = "compliance-os-staging"
}

variable "compliance_os_service_account" {
  description = "Service account for compliance-os ESO IRSA"
  type        = string
  default     = "compliance-os-sa"
}

variable "terminal_os_namespace" {
  description = "Kubernetes namespace for terminal-os ESO (W2-OPS-001)"
  type        = string
  default     = "terminal-os-staging"
}

variable "terminal_os_service_account" {
  description = "Service account for terminal-os ESO IRSA"
  type        = string
  default     = "terminal-os-sa"
}

variable "sensei_os_namespace" {
  description = "Kubernetes namespace for sensei-os PayOps ESO"
  type        = string
  default     = "sensei-os-staging"
}

variable "sensei_os_service_account" {
  description = "Service account for sensei-os PayOps ESO IRSA"
  type        = string
  default     = "sensei-os-sa"
}

variable "nyota_ai_namespace" {
  description = "Kubernetes namespace for nyota-ai PayOps ESO"
  type        = string
  default     = "nyota-ai-staging"
}

variable "nyota_ai_service_account" {
  description = "Service account for nyota-ai PayOps ESO IRSA"
  type        = string
  default     = "nyota-ai-sa"
}

variable "terra_os_namespace" {
  description = "Kubernetes namespace for terra-os ESO (INF-TERRA)"
  type        = string
  default     = "terraos"
}

variable "terra_os_eso_service_account" {
  description = "Service account for terra-os ESO IRSA"
  type        = string
  default     = "terraos-eso-sa"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
