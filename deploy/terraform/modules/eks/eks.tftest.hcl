# =============================================================================
# EKS Module — Terraform Native Tests
# =============================================================================
# Validates security posture of EKS cluster configuration.
# =============================================================================

variables {
  environment          = "test"
  region               = "us-east-1"
  vpc_id               = "vpc-test123"
  private_subnet_ids   = ["subnet-priv-a", "subnet-priv-b"]
  public_subnet_ids    = ["subnet-pub-a", "subnet-pub-b"]
  enable_public_access = false
  allowed_cidr_blocks  = []
}

run "private_api_endpoint_by_default" {
  command = plan

  assert {
    condition     = aws_eks_cluster.main.vpc_config[0].endpoint_private_access == true
    error_message = "EKS must always have private API endpoint enabled"
  }

  assert {
    condition     = aws_eks_cluster.main.vpc_config[0].endpoint_public_access == false
    error_message = "EKS public API should be disabled by default"
  }
}

run "secrets_encryption_enabled" {
  command = plan

  assert {
    condition     = length(aws_eks_cluster.main.encryption_config) > 0
    error_message = "EKS must have secrets encryption enabled via KMS"
  }
}

run "control_plane_logging_enabled" {
  command = plan

  assert {
    condition     = length(aws_eks_cluster.main.enabled_cluster_log_types) == 5
    error_message = "All 5 EKS control plane log types must be enabled"
  }
}

run "oidc_provider_created_for_irsa" {
  command = plan

  assert {
    condition     = contains(aws_iam_openid_connect_provider.eks.client_id_list, "sts.amazonaws.com")
    error_message = "OIDC provider must be configured for IRSA"
  }
}

run "ebs_csi_addon_uses_controller_irsa" {
  command = plan

  assert {
    condition     = aws_eks_addon.ebs_csi.addon_name == "aws-ebs-csi-driver"
    error_message = "EBS CSI managed add-on must remain explicitly declared."
  }

  assert {
    condition     = aws_iam_role.ebs_csi_controller.name == "gtcx-test-ebs-csi-controller"
    error_message = "EBS CSI controller IRSA role must be environment scoped."
  }

  assert {
    condition = (
      aws_iam_role_policy_attachment.ebs_csi_controller.role == aws_iam_role.ebs_csi_controller.name &&
      aws_iam_role_policy_attachment.ebs_csi_controller.policy_arn == "arn:aws:iam::aws:policy/AmazonEBSCSIDriverPolicyV2"
    )
    error_message = "EBS CSI controller IRSA role must use AmazonEBSCSIDriverPolicyV2."
  }
}
