variable "environment" {
  description = "Environment name."
  type        = string
}

variable "namespace" {
  description = "Namespace where Argo CD is installed."
  type        = string
  default     = "argocd"
}

variable "chart_version" {
  description = "Argo CD Helm chart version."
  type        = string
  default     = "7.8.28"
}

variable "server_service_type" {
  description = "Kubernetes service type for the Argo CD API server."
  type        = string
  default     = "ClusterIP"
}

variable "manual_sync_only" {
  description = "Whether Applications should default to manual sync."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}
