# Site Health Check Failed

**Site:** ${{ matrix.site.name }}
**URL:** ${{ matrix.site.url }}
**Time:** ${{ github.event.schedule }}

## Action Required

The daily health check detected an issue with this site.

## Checklist

- [ ] Verify site is accessible manually
- [ ] Check Vercel deployment status
- [ ] Review recent deployments
- [ ] Check DNS configuration

## Links

- Workflow run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
- Vercel Dashboard: https://vercel.com/dashboard
