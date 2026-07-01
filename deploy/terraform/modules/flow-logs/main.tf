# =============================================================================
# VPC Flow Logs — Institutional Network Visibility
# =============================================================================
# Enables VPC Flow Logs for all traffic in the gtcx VPC.
# Logs are sent to CloudWatch Logs and optionally S3 for long-term audit.
# Required by SIGNAL Non-Proliferation controls (network traceability).
#
# Usage:
#   module "flow_logs" {
#     source   = "./modules/flow-logs"
#     vpc_id   = module.vpc.vpc_id
#     log_destination = aws_s3_bucket.flow_logs.arn
#   }
# =============================================================================

variable "vpc_id" {
  description = "VPC ID to enable flow logs for"
  type        = string
}

variable "traffic_type" {
  description = "Traffic to log: ALL, ACCEPT, or REJECT"
  type        = string
  default     = "ALL"
}

variable "log_destination" {
  description = "Optional S3 bucket ARN for flow log destination"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period"
  type        = number
  default     = 365
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "gtcx"
}

variable "iam_role_arn" {
  description = "Existing IAM role ARN for CloudWatch VPC Flow Logs. Ownership belongs to the VPC module."
  type        = string
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/${var.name_prefix}/vpc/flow-logs"
  retention_in_days = var.log_retention_days

  tags = {
    Name      = "${var.name_prefix}-vpc-flow-logs"
    Purpose   = "institutional-controls-phase3"
    ManagedBy = "terraform"
  }
}

resource "aws_flow_log" "main" {
  vpc_id                   = var.vpc_id
  traffic_type             = var.traffic_type
  log_destination_type     = var.log_destination != "" ? "s3" : "cloud-watch-logs"
  log_destination          = var.log_destination != "" ? var.log_destination : aws_cloudwatch_log_group.flow_logs.arn
  iam_role_arn             = var.log_destination == "" ? var.iam_role_arn : null
  max_aggregation_interval = 600

  tags = {
    Name      = "${var.name_prefix}-vpc-flow-log"
    Purpose   = "institutional-controls-phase3"
    ManagedBy = "terraform"
  }
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch Log Group for flow logs"
  value       = aws_cloudwatch_log_group.flow_logs.arn
}

output "flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.main.id
}
