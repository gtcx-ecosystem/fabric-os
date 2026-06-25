---
title: 'griot-ai HTTPS ingress'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'griot-ai', 'staging', 'https', 'acm', 'FB-002']
review_cycle: on-change
---

# griot-ai HTTPS ingress (FB-002)

Fabric-os owns the public HTTPS ingress substrate that unblocks griot-ai `STORY-GRIOT-HTTPS-001`.

## Staging endpoint

- `griot-staging.gtcx.trade` (ACM certificate + Route53 A record + ALB HTTPS listener)

The production endpoint `api.griot.ai` requires a Route53 hosted zone for `griot.ai` that is not present in the staging AWS account; it is out of scope for this staging blocker.

## Architecture

```
Terraform: deploy/terraform/environments/staging/main.tf
        │
        ├── module.griot_ai_ingress
        │       ├── aws_acm_certificate.griot_ai (griot-staging.gtcx.trade)
        │       ├── aws_route53_record validation (gtcx.trade zone)
        │       └── aws_route53_record.griot_ai_a (griot-staging.gtcx.trade → ALB)
        │
        └── kubectl_manifest.griot_ai_ingress
                └── ALB Ingress with certificate-arn + HTTPS:443 listener
```

## Two-apply pattern

### Apply 1 — certificate + validation records

```bash
cd deploy/terraform/environments/staging
terraform plan -target=module.griot_ai_ingress.aws_acm_certificate.griot_ai -target=module.griot_ai_ingress.aws_route53_record.griot_ai_validation
terraform apply -target=module.griot_ai_ingress.aws_acm_certificate.griot_ai -target=module.griot_ai_ingress.aws_route53_record.griot_ai_validation
```

Wait for ACM certificate status `ISSUED`:

```bash
aws acm list-certificates --includes keyTypes=RSA_2048,EC_secp384r1 --query "CertificateSummaryList[?DomainName=='griot-staging.gtcx.trade']"
```

### Deploy K8s ingress

The K8s ingress is applied by Terraform (`kubectl_manifest.griot_ai_ingress`).
To apply it manually:

```bash
kubectl apply -k deploy/kubernetes/overlays/staging/griot-ai
```

Retrieve the ALB DNS name:

```bash
kubectl get ingress -n griot-ai-staging griot-api \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### Apply 2 — A record pointing griot-staging.gtcx.trade to ALB

Set `griot_ai_alb_dns_name` and `griot_ai_alb_zone_id` in `terraform.tfvars` (af-south-1 ALB zone id is `Z268VQBMOI5EKX`).

```bash
terraform apply
```

## Verification

```bash
pnpm griot:https:verify
```

Expected output when complete:

```text
OK acm-certificate-exists
OK acm-certificate-issued
OK route53-a-record-exists
OK k8s-ingress-exists
OK k8s-ingress-https-listener
PASS — griot-ai HTTPS ingress
```

## Class A boundary

- **Fabric-os delivers:** Terraform module, K8s ingress manifest, verification script, runbook.
- **Operator executes:** `terraform apply` in staging and ACM DNS validation.
- **griot-ai executes:** Application deployment behind the ingress.

## Verification artifact

- `audit/evidence/griot-ai-https-verify-latest.json` (when `--write` is used)

## Related

- Fleet unblock register: `docs/operations/coordination/fabric-os-fleet-unblock-register-2026-06-25.md`
- Cross-repo blocker discovery protocol: `docs/operations/protocols/cross-repo-blocker-discovery.md`
