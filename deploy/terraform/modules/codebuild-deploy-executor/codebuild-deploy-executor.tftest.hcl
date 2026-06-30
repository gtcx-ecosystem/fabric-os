variables {
  environment                = "test"
  region                     = "af-south-1"
  vpc_id                     = "vpc-1234567890abcdef0"
  private_subnet_ids         = ["subnet-11111111111111111", "subnet-22222222222222222"]
  eks_cluster_name           = "gtcx-test-eks"
  terraform_state_bucket_arn = "arn:aws:s3:::gtcx-terraform-state-test"
  terraform_lock_table_arn   = "arn:aws:dynamodb:us-east-1:123456789012:table/gtcx-terraform-locks-test"
  evidence_bucket_arns       = ["arn:aws:s3:::gtcx-test-worm-audit"]
}

run "uses_vpc_attached_codebuild" {
  command = plan

  assert {
    condition     = aws_codebuild_project.deploy.vpc_config[0].vpc_id == var.vpc_id
    error_message = "Deploy executor must run inside the environment VPC."
  }

  assert {
    condition     = aws_codebuild_project.deploy.vpc_config[0].subnets == var.private_subnet_ids
    error_message = "Deploy executor must use private subnets for private EKS API access."
  }
}

run "github_actions_is_not_required_source" {
  command = plan

  assert {
    condition     = aws_codebuild_project.deploy.source[0].type == "NO_SOURCE"
    error_message = "Default deploy executor must not require GitHub Actions execution."
  }
}

run "grants_eks_access_to_codebuild_role" {
  command = plan

  assert {
    condition     = aws_eks_access_entry.deploy.principal_arn == aws_iam_role.deploy.arn
    error_message = "CodeBuild deploy role must be registered with EKS access entries."
  }

  assert {
    condition     = aws_eks_access_policy_association.deploy_admin.policy_arn == "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
    error_message = "Deploy executor needs Kubernetes API access for Argo CD/bootstrap operations."
  }
}
