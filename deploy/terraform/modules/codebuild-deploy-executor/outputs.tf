output "project_name" {
  description = "CodeBuild deploy executor project name."
  value       = aws_codebuild_project.deploy.name
}

output "project_arn" {
  description = "CodeBuild deploy executor project ARN."
  value       = aws_codebuild_project.deploy.arn
}

output "deploy_role_arn" {
  description = "IAM role ARN used by the CodeBuild deploy executor."
  value       = aws_iam_role.deploy.arn
}

output "deploy_role_name" {
  description = "IAM role name used by the CodeBuild deploy executor."
  value       = aws_iam_role.deploy.name
}

output "security_group_id" {
  description = "Security group ID attached to the CodeBuild deploy executor."
  value       = aws_security_group.codebuild.id
}

output "log_group_name" {
  description = "CloudWatch log group name for deploy executor logs."
  value       = aws_cloudwatch_log_group.deploy.name
}
