# CommOps staging — bounce webhook ingress

SendGrid Event Webhook and Twilio status callbacks for fleet deliverability witness.

## Apply

```bash
kubectl apply -k deploy/kubernetes/overlays/staging/commops/
```

## Endpoints (staging)

| Provider | URL                                                           |
| -------- | ------------------------------------------------------------- |
| SendGrid | `https://commops-staging.gtcx.trade/webhooks/sendgrid/events` |
| Twilio   | `https://commops-staging.gtcx.trade/webhooks/twilio/status`   |
| Health   | `https://commops-staging.gtcx.trade/health`                   |

## Verification

```bash
pnpm commops:deliverability:check:write
curl -sS https://commops-staging.gtcx.trade/health
```

## DNS + TLS

`commops-staging.gtcx.trade` is **not** covered by `*.staging.gtcx.trade` ACM SAN — issue a dedicated cert and attach DNS:

```bash
# Vault: CLOUDFLARE_DNS_API_TOKEN (Zone DNS Edit)
set -a && source ~/.baseline/env && set +a
export CLOUDFLARE_API_TOKEN="$(baseline vault get CLOUDFLARE_DNS_API_TOKEN --trust-score 100)"
export ALB_DNS="k8s-gtcxstagingapi-295a96727a-1533822930.af-south-1.elb.amazonaws.com"
bash deploy/03-platform/scripts/attach-commops-staging-domain.sh
kubectl apply -k deploy/kubernetes/overlays/staging/commops/
```

ACM cert: `arn:aws:acm:af-south-1:348389439381:certificate/4d666fa3-427d-45b5-a460-e4a8032cb4c5` (ingress annotation on commops ALB group).

Local server source: `platform/tools/commops-bounce-webhook/server.mjs`
