output "namespace" {
  description = "Argo CD namespace."
  value       = helm_release.argocd.namespace
}

output "release_name" {
  description = "Argo CD Helm release name."
  value       = helm_release.argocd.name
}

output "chart" {
  description = "Argo CD Helm chart."
  value       = helm_release.argocd.chart
}

output "chart_version" {
  description = "Argo CD Helm chart version."
  value       = helm_release.argocd.version
}
