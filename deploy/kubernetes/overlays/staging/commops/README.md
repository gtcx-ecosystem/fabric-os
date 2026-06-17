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
```

Local server source: `platform/tools/commops-bounce-webhook/server.mjs`
