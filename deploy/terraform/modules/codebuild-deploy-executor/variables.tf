variable "environment" {
  description = "Environment name."
  type        = string
}

variable "region" {
  description = "AWS region where the executor runs."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the CodeBuild executor."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs used by the VPC-attached CodeBuild executor."
  type        = list(string)
}

variable "eks_cluster_name" {
  description = "EKS cluster name targeted by deployment jobs."
  type        = string
}

variable "terraform_state_bucket_arn" {
  description = "Terraform state S3 bucket ARN used by this environment."
  type        = string
}

variable "terraform_lock_table_arn" {
  description = "Terraform state DynamoDB lock table ARN used by this environment."
  type        = string
}

variable "evidence_bucket_arns" {
  description = "S3 bucket ARNs where redacted deployment evidence may be written."
  type        = list(string)
  default     = []
}

variable "evidence_kms_key_arns" {
  description = "KMS key ARNs used by evidence buckets."
  type        = list(string)
  default     = []
}

variable "source_type" {
  description = "CodeBuild source type. GITHUB is SCM input only; execution remains in AWS CodeBuild."
  type        = string
  default     = "NO_SOURCE"
}

variable "source_location" {
  description = "Optional source location for non-NO_SOURCE CodeBuild projects."
  type        = string
  default     = null
}

variable "compute_type" {
  description = "CodeBuild compute type."
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

variable "image" {
  description = "CodeBuild managed image."
  type        = string
  default     = "aws/codebuild/standard:7.0"
}

variable "privileged_mode" {
  description = "Enable Docker-in-Docker for image build jobs. Deploy executor defaults false."
  type        = bool
  default     = false
}

variable "buildspec" {
  description = "Inline buildspec or buildspec path supplied by source."
  type        = string
  default     = <<-YAML
    version: 0.2
    phases:
      build:
        commands:
          - echo "gtcx deploy executor ready"
          - aws sts get-caller-identity
    artifacts:
      files: []
  YAML
}

variable "environment_variables" {
  description = "Additional CodeBuild environment variables."
  type        = map(string)
  default     = {}
}

variable "log_retention_days" {
  description = "CloudWatch log retention for deploy executor logs."
  type        = number
  default     = 90
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}
