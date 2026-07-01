# =============================================================================
# CodeBuild Deploy Executor — GitHub Actions Billing Independent CI/CD
# =============================================================================
# Runs deploy/terraform/kubectl jobs from inside the environment VPC so private
# EKS API access does not depend on GitHub Actions hosted or self-hosted runners.
# =============================================================================

data "aws_caller_identity" "current" {}

locals {
  name                      = "gtcx-${var.environment}-deploy-executor"
  ebs_csi_driver_policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"

  default_environment_variables = {
    AWS_REGION                   = var.region
    EKS_CLUSTER_NAME             = var.eks_cluster_name
    ENVIRONMENT                  = var.environment
    DEPLOYMENT_OPS_CONTRACT      = "machine/spec/deployment-ops-contract.json"
    GITHUB_ACTIONS_CRITICAL_PATH = "false"
    KUBERNETES_DELIVERY          = "argocd-in-eks"
    TERRAFORM_STATE_BUCKET_ARN   = var.terraform_state_bucket_arn
    TERRAFORM_LOCK_TABLE_ARN     = var.terraform_lock_table_arn
  }

  environment_variables = merge(local.default_environment_variables, var.environment_variables)
  evidence_object_arns  = [for arn in var.evidence_bucket_arns : "${arn}/*"]
  deploy_policy_statements = concat(
    [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
        ]
        Resource = "${aws_cloudwatch_log_group.deploy.arn}:*"
      },
      {
        Sid    = "CloudWatchLogsList"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:ListTagsForResource",
        ]
        Resource = "*"
      },
      {
        Sid    = "CodeBuildVpcNetworking"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeDhcpOptions",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
        ]
        Resource = "*"
      },
      {
        Sid    = "CodeBuildNetworkInterfacePermission"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterfacePermission",
        ]
        Resource = "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:network-interface/*"
        Condition = {
          StringEquals = {
            "ec2:AuthorizedService" = "codebuild.amazonaws.com"
          }
          ArnEquals = {
            "ec2:Subnet" = [for subnet_id in var.private_subnet_ids : "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:subnet/${subnet_id}"]
          }
        }
      },
      {
        Sid    = "EksDescribe"
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters",
        ]
        Resource = "arn:aws:eks:${var.region}:${data.aws_caller_identity.current.account_id}:cluster/${var.eks_cluster_name}"
      },
      {
        Sid    = "AcmRead"
        Effect = "Allow"
        Action = [
          "acm:DescribeCertificate",
          "acm:ListCertificates",
        ]
        Resource = "arn:aws:acm:${var.region}:${data.aws_caller_identity.current.account_id}:certificate/*"
      },
      {
        Sid    = "Wafv2Read"
        Effect = "Allow"
        Action = [
          "wafv2:GetWebACL",
          "wafv2:ListWebACLs",
          "wafv2:ListTagsForResource",
        ]
        Resource = "arn:aws:wafv2:${var.region}:${data.aws_caller_identity.current.account_id}:regional/webacl/*/*"
      },
      {
        Sid    = "IamOidcRead"
        Effect = "Allow"
        Action = [
          "iam:GetOpenIDConnectProvider",
          "iam:ListOpenIDConnectProviders",
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/*"
      },
      {
        Sid    = "IamRoleRead"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:ListPolicyVersions",
          "iam:ListInstanceProfiles",
          "iam:GetInstanceProfile",
        ]
        Resource = [
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name}",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/gtcx-${var.environment}-shared-deploy",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/gtcx-${var.environment}-*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/gtcx-*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:instance-profile/gtcx-*",
        ]
      },
      {
        Sid    = "IamRoleManageGtcx"
        Effect = "Allow"
        Action = [
          "iam:DeleteRolePolicy",
          "iam:PutRolePolicy",
          "iam:TagRole",
          "iam:UntagRole",
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/gtcx-${var.environment}-*"
      },
      {
        Sid    = "IamPolicyManageGtcx"
        Effect = "Allow"
        Action = [
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:SetDefaultPolicyVersion",
          "iam:TagPolicy",
          "iam:UntagPolicy",
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/gtcx-${var.environment}-*"
      },
      {
        Sid    = "Ec2SecurityGroupManage"
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
        ]
        Resource = "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:security-group/*"
      },
      {
        Sid    = "EksNodeGroupManage"
        Effect = "Allow"
        Action = [
          "eks:UpdateNodegroupConfig",
        ]
        Resource = "arn:aws:eks:${var.region}:${data.aws_caller_identity.current.account_id}:nodegroup/${var.eks_cluster_name}/*/*"
      },
      {
        Sid    = "EksAddonManage"
        Effect = "Allow"
        Action = [
          "eks:CreateAddon",
          "eks:DeleteAddon",
          "eks:UpdateAddon",
        ]
        Resource = "arn:aws:eks:${var.region}:${data.aws_caller_identity.current.account_id}:addon/${var.eks_cluster_name}/*/*"
      },
      {
        Sid    = "IamAttachEbsCsiPolicyToNodeRole"
        Effect = "Allow"
        Action = [
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/gtcx-${var.environment}-node-role"
        Condition = {
          ArnEquals = {
            "iam:PolicyARN" = local.ebs_csi_driver_policy_arn
          }
        }
      },
      {
        Sid    = "RdsParameterGroupManage"
        Effect = "Allow"
        Action = [
          "rds:AddTagsToResource",
          "rds:ModifyDBParameterGroup",
          "rds:RemoveTagsFromResource",
        ]
        Resource = "arn:aws:rds:${var.region}:${data.aws_caller_identity.current.account_id}:pg:gtcx-${var.environment}-*"
      },
      {
        Sid    = "LambdaCodeManage"
        Effect = "Allow"
        Action = [
          "lambda:TagResource",
          "lambda:UntagResource",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
        ]
        Resource = "arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:gtcx-${var.environment}-*"
      },
      {
        Sid    = "RdsRead"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBParameterGroups",
          "rds:DescribeDBParameters",
          "rds:DescribeDBSubnetGroups",
          "rds:DescribeDBSnapshots",
          "rds:ListTagsForResource",
        ]
        Resource = "arn:aws:rds:${var.region}:${data.aws_caller_identity.current.account_id}:db:gtcx-${var.environment}-*"
      },
      {
        Sid    = "EcrAuth"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
        ]
        Resource = "*"
      },
      {
        Sid    = "EcrGtcxRepositories"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:ListImages",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
        ]
        Resource = "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/gtcx-*"
      },
      {
        Sid    = "CodeArtifactNpmAuth"
        Effect = "Allow"
        Action = [
          "codeartifact:DescribeDomain",
          "codeartifact:DescribeRepository",
          "codeartifact:GetAuthorizationToken",
          "codeartifact:GetRepositoryEndpoint",
          "codeartifact:PublishPackageVersion",
          "codeartifact:ReadFromRepository",
        ]
        Resource = [
          "arn:aws:codeartifact:eu-west-1:${data.aws_caller_identity.current.account_id}:domain/gtcx-packages",
          "arn:aws:codeartifact:eu-west-1:${data.aws_caller_identity.current.account_id}:repository/gtcx-packages/npm-internal",
          "arn:aws:codeartifact:eu-west-1:${data.aws_caller_identity.current.account_id}:package/gtcx-packages/npm-internal/npm/gtcx/*",
        ]
      },
      {
        Sid    = "CodeArtifactBearerToken"
        Effect = "Allow"
        Action = [
          "sts:GetServiceBearerToken",
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "sts:AWSServiceName" = "codeartifact.amazonaws.com"
          }
        }
      },
      {
        Sid    = "TerraformStateReadWrite"
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:ListBucket",
        ]
        Resource = var.terraform_state_bucket_arn
      },
      {
        Sid    = "TerraformStateObjects"
        Effect = "Allow"
        Action = [
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
        ]
        Resource = "${var.terraform_state_bucket_arn}/*"
      },
      {
        Sid    = "TerraformStateLock"
        Effect = "Allow"
        Action = [
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
        ]
        Resource = var.terraform_lock_table_arn
      },
      {
        Sid    = "SecretsReadGtcx"
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
        ]
        Resource = "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:gtcx/*"
      },
      {
        Sid    = "CallerIdentity"
        Effect = "Allow"
        Action = [
          "sts:GetCallerIdentity",
        ]
        Resource = "*"
      },
    ],
    length(var.evidence_bucket_arns) > 0 ? [
      {
        Sid    = "EvidenceBucketList"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
        ]
        Resource = var.evidence_bucket_arns
      },
      {
        Sid    = "EvidenceObjectWrite"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
        ]
        Resource = local.evidence_object_arns
      },
    ] : [],
    length(var.evidence_kms_key_arns) > 0 ? [
      {
        Sid    = "EvidenceKms"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey",
        ]
        Resource = var.evidence_kms_key_arns
      },
    ] : []
  )
}

resource "aws_security_group" "codebuild" {
  name        = "${local.name}-sg"
  description = "VPC egress for ${local.name}"
  vpc_id      = var.vpc_id

  egress {
    description = "Outbound access to VPC endpoints, EKS, and AWS APIs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name      = "${local.name}-sg"
    Component = "deploy-executor"
  })
}

resource "aws_security_group_rule" "codebuild_to_eks_api" {
  count = var.eks_cluster_security_group_id != "" ? 1 : 0

  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.codebuild.id
  security_group_id        = var.eks_cluster_security_group_id
  description              = "Allow ${local.name} to reach EKS cluster API endpoint"
}

resource "aws_cloudwatch_log_group" "deploy" {
  name              = "/aws/codebuild/${local.name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name      = "/aws/codebuild/${local.name}"
    Component = "deploy-executor"
  })
}

resource "aws_iam_role" "deploy" {
  name = local.name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "codebuild.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = merge(var.tags, {
    Component = "deploy-executor"
  })
}

resource "aws_iam_role_policy_attachment" "deploy_readonly" {
  role       = aws_iam_role.deploy.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy" "deploy" {
  name = "${local.name}-policy"
  role = aws_iam_role.deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "CloudWatchLogs"
          Effect = "Allow"
          Action = [
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogStreams",
          ]
          Resource = "${aws_cloudwatch_log_group.deploy.arn}:*"
        },
        {
          Sid    = "CloudWatchLogsList"
          Effect = "Allow"
          Action = [
            "logs:DescribeLogGroups",
            "logs:ListTagsForResource",
          ]
          Resource = "*"
        },
        {
          Sid    = "CodeBuildVpcNetworking"
          Effect = "Allow"
          Action = [
            "ec2:CreateNetworkInterface",
            "ec2:DeleteNetworkInterface",
            "ec2:DescribeDhcpOptions",
            "ec2:DescribeNetworkInterfaces",
            "ec2:DescribeSecurityGroups",
            "ec2:DescribeSubnets",
            "ec2:DescribeVpcs",
          ]
          Resource = "*"
        },
        {
          Sid    = "CodeBuildNetworkInterfacePermission"
          Effect = "Allow"
          Action = [
            "ec2:CreateNetworkInterfacePermission",
          ]
          Resource = "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:network-interface/*"
          Condition = {
            StringEquals = {
              "ec2:AuthorizedService" = "codebuild.amazonaws.com"
            }
            ArnEquals = {
              "ec2:Subnet" = [for subnet_id in var.private_subnet_ids : "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:subnet/${subnet_id}"]
            }
          }
        },
        {
          Sid    = "EksDescribe"
          Effect = "Allow"
          Action = [
            "eks:DescribeCluster",
            "eks:ListClusters",
          ]
          Resource = "arn:aws:eks:${var.region}:${data.aws_caller_identity.current.account_id}:cluster/${var.eks_cluster_name}"
        },
        {
          Sid    = "AcmRead"
          Effect = "Allow"
          Action = [
            "acm:DescribeCertificate",
            "acm:ListCertificates",
          ]
          Resource = "arn:aws:acm:${var.region}:${data.aws_caller_identity.current.account_id}:certificate/*"
        },
        {
          Sid    = "Wafv2Read"
          Effect = "Allow"
          Action = [
            "wafv2:GetWebACL",
            "wafv2:ListWebACLs",
            "wafv2:ListTagsForResource",
          ]
          Resource = "arn:aws:wafv2:${var.region}:${data.aws_caller_identity.current.account_id}:regional/webacl/*/*"
        },
        {
          Sid    = "IamOidcRead"
          Effect = "Allow"
          Action = [
            "iam:GetOpenIDConnectProvider",
            "iam:ListOpenIDConnectProviders",
          ]
          Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/*"
        },
        {
          Sid    = "IamRoleRead"
          Effect = "Allow"
          Action = [
            "iam:GetRole",
            "iam:GetRolePolicy",
            "iam:ListRolePolicies",
            "iam:ListAttachedRolePolicies",
            "iam:GetPolicy",
            "iam:GetPolicyVersion",
            "iam:ListPolicyVersions",
            "iam:ListInstanceProfiles",
            "iam:GetInstanceProfile",
          ]
          Resource = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name}",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/gtcx-${var.environment}-shared-deploy",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/gtcx-${var.environment}-*",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/gtcx-*",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:instance-profile/gtcx-*",
          ]
        },
        {
          Sid    = "IamRoleManageGtcx"
          Effect = "Allow"
          Action = [
            "iam:DeleteRolePolicy",
            "iam:PutRolePolicy",
            "iam:TagRole",
            "iam:UntagRole",
          ]
          Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/gtcx-${var.environment}-*"
        },
        {
          Sid    = "IamPolicyManageGtcx"
          Effect = "Allow"
          Action = [
            "iam:CreatePolicyVersion",
            "iam:DeletePolicyVersion",
            "iam:SetDefaultPolicyVersion",
            "iam:TagPolicy",
            "iam:UntagPolicy",
          ]
          Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/gtcx-${var.environment}-*"
        },
        {
          Sid    = "Ec2SecurityGroupManage"
          Effect = "Allow"
          Action = [
            "ec2:AuthorizeSecurityGroupEgress",
            "ec2:AuthorizeSecurityGroupIngress",
            "ec2:RevokeSecurityGroupEgress",
            "ec2:RevokeSecurityGroupIngress",
          ]
          Resource = "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:security-group/*"
        },
        {
          Sid    = "EksNodeGroupManage"
          Effect = "Allow"
          Action = [
            "eks:UpdateNodegroupConfig",
          ]
          Resource = "arn:aws:eks:${var.region}:${data.aws_caller_identity.current.account_id}:nodegroup/${var.eks_cluster_name}/*/*"
        },
        {
          Sid    = "RdsParameterGroupManage"
          Effect = "Allow"
          Action = [
            "rds:AddTagsToResource",
            "rds:ModifyDBParameterGroup",
            "rds:RemoveTagsFromResource",
          ]
          Resource = "arn:aws:rds:${var.region}:${data.aws_caller_identity.current.account_id}:pg:gtcx-${var.environment}-*"
        },
        {
          Sid    = "LambdaCodeManage"
          Effect = "Allow"
          Action = [
            "lambda:TagResource",
            "lambda:UntagResource",
            "lambda:UpdateFunctionCode",
            "lambda:UpdateFunctionConfiguration",
          ]
          Resource = "arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:gtcx-${var.environment}-*"
        },
        {
          Sid    = "RdsRead"
          Effect = "Allow"
          Action = [
            "rds:DescribeDBInstances",
            "rds:DescribeDBParameterGroups",
            "rds:DescribeDBParameters",
            "rds:DescribeDBSubnetGroups",
            "rds:DescribeDBSnapshots",
            "rds:ListTagsForResource",
          ]
          Resource = "arn:aws:rds:${var.region}:${data.aws_caller_identity.current.account_id}:db:gtcx-${var.environment}-*"
        },
        {
          Sid    = "EcrAuth"
          Effect = "Allow"
          Action = [
            "ecr:GetAuthorizationToken",
          ]
          Resource = "*"
        },
        {
          Sid    = "EcrGtcxRepositories"
          Effect = "Allow"
          Action = [
            "ecr:BatchCheckLayerAvailability",
            "ecr:BatchGetImage",
            "ecr:CompleteLayerUpload",
            "ecr:DescribeImages",
            "ecr:DescribeRepositories",
            "ecr:GetDownloadUrlForLayer",
            "ecr:InitiateLayerUpload",
            "ecr:ListImages",
            "ecr:PutImage",
            "ecr:UploadLayerPart",
          ]
          Resource = "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/gtcx-*"
        },
        {
          Sid    = "CodeArtifactNpmAuth"
          Effect = "Allow"
          Action = [
            "codeartifact:DescribeDomain",
            "codeartifact:DescribeRepository",
            "codeartifact:GetAuthorizationToken",
            "codeartifact:GetRepositoryEndpoint",
            "codeartifact:PublishPackageVersion",
            "codeartifact:ReadFromRepository",
          ]
          Resource = [
            "arn:aws:codeartifact:eu-west-1:${data.aws_caller_identity.current.account_id}:domain/gtcx-packages",
            "arn:aws:codeartifact:eu-west-1:${data.aws_caller_identity.current.account_id}:repository/gtcx-packages/npm-internal",
            "arn:aws:codeartifact:eu-west-1:${data.aws_caller_identity.current.account_id}:package/gtcx-packages/npm-internal/npm/gtcx/*",
          ]
        },
        {
          Sid    = "CodeArtifactBearerToken"
          Effect = "Allow"
          Action = [
            "sts:GetServiceBearerToken",
          ]
          Resource = "*"
          Condition = {
            StringEquals = {
              "sts:AWSServiceName" = "codeartifact.amazonaws.com"
            }
          }
        },
        {
          Sid    = "TerraformStateReadWrite"
          Effect = "Allow"
          Action = [
            "s3:GetBucketVersioning",
            "s3:ListBucket",
          ]
          Resource = var.terraform_state_bucket_arn
        },
        {
          Sid    = "TerraformStateObjects"
          Effect = "Allow"
          Action = [
            "s3:DeleteObject",
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:PutObject",
          ]
          Resource = "${var.terraform_state_bucket_arn}/*"
        },
        {
          Sid    = "TerraformStateLock"
          Effect = "Allow"
          Action = [
            "dynamodb:DeleteItem",
            "dynamodb:DescribeTable",
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
          ]
          Resource = var.terraform_lock_table_arn
        },
        {
          Sid    = "SecretsReadGtcx"
          Effect = "Allow"
          Action = [
            "secretsmanager:DescribeSecret",
            "secretsmanager:GetSecretValue",
          ]
          Resource = "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:gtcx/*"
        },
        {
          Sid    = "CallerIdentity"
          Effect = "Allow"
          Action = [
            "sts:GetCallerIdentity",
          ]
          Resource = "*"
        },
      ],
      length(var.evidence_bucket_arns) > 0 ? [
        {
          Sid    = "EvidenceBucketList"
          Effect = "Allow"
          Action = [
            "s3:ListBucket",
          ]
          Resource = var.evidence_bucket_arns
        },
        {
          Sid    = "EvidenceObjectWrite"
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject",
          ]
          Resource = local.evidence_object_arns
        },
      ] : [],
      length(var.evidence_kms_key_arns) > 0 ? [
        {
          Sid    = "EvidenceKms"
          Effect = "Allow"
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:GenerateDataKey",
          ]
          Resource = var.evidence_kms_key_arns
        },
      ] : []
    )
  })
}

resource "aws_codebuild_project" "deploy" {
  name          = local.name
  description   = "GTCX ${var.environment} VPC deploy executor; GitHub Actions is not production critical path."
  service_role  = aws_iam_role.deploy.arn
  build_timeout = 60

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = var.compute_type
    image                       = var.image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = var.privileged_mode

    dynamic "environment_variable" {
      for_each = local.environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value
        type  = "PLAINTEXT"
      }
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.deploy.name
      stream_name = "deploy"
      status      = "ENABLED"
    }
  }

  source {
    type      = var.source_type
    location  = var.source_location
    buildspec = var.buildspec
  }

  vpc_config {
    vpc_id             = var.vpc_id
    subnets            = var.private_subnet_ids
    security_group_ids = [aws_security_group.codebuild.id]
  }

  tags = merge(var.tags, {
    Component = "deploy-executor"
  })
}

resource "aws_eks_access_entry" "deploy" {
  cluster_name  = var.eks_cluster_name
  principal_arn = aws_iam_role.deploy.arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "deploy_admin" {
  cluster_name  = var.eks_cluster_name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = aws_iam_role.deploy.arn

  access_scope {
    type = "cluster"
  }

  depends_on = [aws_eks_access_entry.deploy]
}
