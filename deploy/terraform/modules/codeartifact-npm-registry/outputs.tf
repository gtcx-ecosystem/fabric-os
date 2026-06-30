output "domain_name" {
  description = "CodeArtifact domain name."
  value       = aws_codeartifact_domain.this.domain
}

output "repository_name" {
  description = "CodeArtifact repository name."
  value       = aws_codeartifact_repository.npm_internal.repository
}

output "repository_arn" {
  description = "CodeArtifact repository ARN."
  value       = aws_codeartifact_repository.npm_internal.arn
}

output "npm_login_command" {
  description = "Operator command to configure npm for this repository."
  value       = "aws codeartifact login --tool npm --domain ${aws_codeartifact_domain.this.domain} --repository ${aws_codeartifact_repository.npm_internal.repository}"
}
