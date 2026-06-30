variable "domain_name" {
  description = "CodeArtifact domain name for GTCX package continuity."
  type        = string
  default     = "gtcx-packages"
}

variable "repository_name" {
  description = "CodeArtifact npm repository name."
  type        = string
  default     = "npm-internal"
}

variable "description" {
  description = "Repository description."
  type        = string
  default     = "Internal npm registry for GTCX package continuity."
}

variable "kms_key_arn" {
  description = "Optional KMS key ARN for the CodeArtifact domain."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags applied to CodeArtifact resources."
  type        = map(string)
  default     = {}
}
