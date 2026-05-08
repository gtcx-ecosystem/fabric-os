output "bucket_name" {
  description = "Name of the WORM audit S3 bucket"
  value       = aws_s3_bucket.worm.id
}

output "bucket_arn" {
  description = "ARN of the WORM audit S3 bucket"
  value       = aws_s3_bucket.worm.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for WORM audit encryption"
  value       = aws_kms_key.worm.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for WORM audit encryption"
  value       = aws_kms_key.worm.key_id
}

output "replica_bucket_arn" {
  description = "ARN of the replica bucket (null if replication disabled)"
  value       = local.enable_replication ? aws_s3_bucket.replica[0].arn : null
}

output "replica_bucket_name" {
  description = "Name of the replica bucket (null if replication disabled)"
  value       = local.enable_replication ? aws_s3_bucket.replica[0].id : null
}

output "deletion_alarm_arn" {
  description = "ARN of the CloudWatch alarm for deletion attempts"
  value       = aws_cloudwatch_metric_alarm.delete_api_calls.arn
}
