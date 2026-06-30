run "codeartifact_npm_registry_contract" {
  command = plan

  assert {
    condition     = aws_codeartifact_domain.this.domain == var.domain_name
    error_message = "CodeArtifact domain must use the configured domain name."
  }

  assert {
    condition     = aws_codeartifact_repository.npm_internal.repository == var.repository_name
    error_message = "CodeArtifact npm repository must use the configured repository name."
  }

  assert {
    condition     = aws_codeartifact_repository.npm_internal.external_connections[0].external_connection_name == "public:npmjs"
    error_message = "Internal npm repository must connect to public:npmjs as upstream."
  }
}
