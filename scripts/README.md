# Debugging scripts

The scripts are typescript, and are run using the `deno` runtime by flat data.

To run locally, you will need to install [`deno`](https://deno.land/).

Then (from the root directory) run this command:

```sh
deno run -q --allow-read --allow-write --allow-run --allow-net --allow-env --unstable ./scripts/extract-vaccination-sites.ts data/vaccination-sites.xlsx
```