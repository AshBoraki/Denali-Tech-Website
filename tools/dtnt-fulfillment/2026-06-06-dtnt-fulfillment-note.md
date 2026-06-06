# DTNT Fulfillment Workflow Note

Date: 2026-06-06

What this is for:
- This note explains why the `DTNT Fulfillment` GitHub Actions workflow failed in the Denali site repo and what needs to change later.

What failed:
- Workflow: `.github/workflows/dtnt-fulfillment.yml`
- Failing step: `Build DTNT fulfillment files`
- Error: `Cannot find module './tools/dtnt-fulfillment/fulfill-orders.cjs'`

Why it failed:
- The workflow still runs in the Denali website repo.
- It expects these local scripts:
  - `tools/dtnt-fulfillment/fulfill-orders.cjs`
  - `tools/dtnt-fulfillment/license.cjs`
- Those files were present in the main workspace, but missing from the published GitHub repo checkout that Actions used.

What was done on 2026-06-06:
- Restored the missing DTNT fulfillment scripts to this repo so the existing workflow can run again.
- Left the workflow in place for now because it is still generating:
  - `Net-tools/orders`
  - `Net-tools/licenses`

What should change later:
- Move DTNT fulfillment automation out of the Denali website repo and into the real DTNT repo.
- Move the workflow, Stripe fulfillment scripts, and any DTNT-specific generated artifacts together.
- After that move:
  - remove the DTNT fulfillment workflow from this repo
  - remove DTNT fulfillment tooling from this repo
  - keep only the public redirect/content pieces on `denalitechs.com`

Why this matters:
- DTNT is now its own product/domain lane.
- The Denali website repo should not be the long-term owner of DTNT order fulfillment logic.
