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

override_data {
  target = data.aws_caller_identity.current
  values = {
    account_id = "123456789012"
    arn        = "arn:aws:iam::123456789012:root"
    user_id    = "123456789012"
  }
}

run "uses_vpc_attached_codebuild" {
  command = plan

  assert {
    condition     = aws_codebuild_project.deploy.vpc_config[0].vpc_id == var.vpc_id
    error_message = "Deploy executor must run inside the environment VPC."
  }

  assert {
    condition     = toset(aws_codebuild_project.deploy.vpc_config[0].subnets) == toset(var.private_subnet_ids)
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
    condition     = aws_eks_access_entry.deploy.cluster_name == var.eks_cluster_name && aws_eks_access_entry.deploy.type == "STANDARD"
    error_message = "CodeBuild deploy role must be registered with EKS access entries."
  }

  assert {
    condition     = aws_eks_access_policy_association.deploy_admin.policy_arn == "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
    error_message = "Deploy executor needs Kubernetes API access for Argo CD/bootstrap operations."
  }
}

run "creates_environment_scoped_inline_policy" {
  command = plan

  assert {
    condition     = aws_iam_role_policy.deploy.name == "gtcx-test-deploy-executor-policy"
    error_message = "Deploy executor mutation permissions must remain attached to the environment-scoped inline policy."
  }
}

run "permits_scoped_ebs_csi_addon_repair" {
  command = plan

  assert {
    condition = anytrue([
      for statement in local.deploy_policy_statements :
      statement.Sid == "EksAddonCreate" &&
      contains(statement.Action, "eks:CreateAddon") &&
      length(statement.Action) == 1 &&
      statement.Resource == "*"
    ])
    error_message = "EKS CreateAddon is wildcard-resource evaluated; deploy executor must not combine it with broader EKS mutations."
  }

  assert {
    condition = anytrue([
      for statement in local.deploy_policy_statements :
      statement.Sid == "EksAddonManage" &&
      contains(statement.Action, "eks:UpdateAddon") &&
      statement.Resource == "arn:aws:eks:af-south-1:123456789012:addon/gtcx-test-eks/*/*"
    ])
    error_message = "Deploy executor must update/delete add-ons only on the target EKS add-on ARN."
  }

  assert {
    condition = anytrue([
      for statement in local.deploy_policy_statements :
      statement.Sid == "EksAddonTag" &&
      contains(statement.Action, "eks:TagResource") &&
      length(statement.Action) == 1 &&
      statement.Resource == "arn:aws:eks:af-south-1:123456789012:addon/gtcx-test-eks/*/*"
    ])
    error_message = "Deploy executor must tag EKS add-ons only on the target EKS add-on ARN."
  }

  assert {
    condition = anytrue([
      for statement in local.deploy_policy_statements :
      statement.Sid == "IamAttachEbsCsiPolicyToNodeRole" &&
      contains(statement.Action, "iam:AttachRolePolicy") &&
      contains(statement.Action, "iam:DetachRolePolicy") &&
      statement.Resource == "arn:aws:iam::123456789012:role/gtcx-test-node-role" &&
      statement.Condition.ArnEquals["iam:PolicyARN"] == "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
    ])
    error_message = "Deploy executor must attach only the EBS CSI managed policy to the environment node role."
  }
}
