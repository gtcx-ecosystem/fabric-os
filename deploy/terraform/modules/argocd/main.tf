# =============================================================================
# Argo CD
# =============================================================================
# Installs Argo CD in-cluster. Applications remain manual-sync by default so
# production delivery does not become automatic before approval gates exist.
# =============================================================================

resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = var.chart_version
  namespace        = var.namespace
  create_namespace = true
  wait             = true
  timeout          = 600

  values = [
    yamlencode({
      global = {
        additionalLabels = {
          "gtcx.io/environment" = var.environment
          "gtcx.io/component"   = "argocd"
        }
      }

      configs = {
        cm = {
          "application.instanceLabelKey" = "argocd.argoproj.io/instance"
          "timeout.reconciliation"       = "180s"
        }
        params = {
          "server.insecure" = "false"
        }
      }

      controller = {
        metrics = {
          enabled = true
        }
      }

      repoServer = {
        metrics = {
          enabled = true
        }
      }

      server = {
        service = {
          type = var.server_service_type
        }
        metrics = {
          enabled = true
        }
      }

      dex = {
        enabled = false
      }

      notifications = {
        enabled = false
      }

      applicationSet = {
        enabled = true
      }
    })
  ]
}
