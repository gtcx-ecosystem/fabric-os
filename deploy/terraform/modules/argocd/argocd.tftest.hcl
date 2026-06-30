variables {
  environment = "test"
}

run "installs_argocd_chart" {
  command = plan

  assert {
    condition     = helm_release.argocd.chart == "argo-cd"
    error_message = "Argo CD module must install the argo-cd Helm chart."
  }

  assert {
    condition     = helm_release.argocd.repository == "https://argoproj.github.io/argo-helm"
    error_message = "Argo CD module must use the official Argo Helm repository."
  }
}

run "creates_argocd_namespace" {
  command = plan

  assert {
    condition     = helm_release.argocd.namespace == "argocd"
    error_message = "Argo CD must install into the argocd namespace by default."
  }

  assert {
    condition     = helm_release.argocd.create_namespace == true
    error_message = "Argo CD install should create its namespace."
  }
}
