locals {
  tags = merge(
    {
      ManagedBy = "fabric-os"
      Purpose   = "package-registry-continuity"
    },
    var.tags,
  )
}

resource "aws_codeartifact_domain" "this" {
  domain         = var.domain_name
  encryption_key = var.kms_key_arn
  tags           = local.tags
}

resource "aws_codeartifact_repository" "npm_internal" {
  domain      = aws_codeartifact_domain.this.domain
  repository  = var.repository_name
  description = var.description

  external_connections {
    external_connection_name = "public:npmjs"
  }

  tags = local.tags
}
