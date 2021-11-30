import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { parse, stringify } from 'https://deno.land/std@0.116.0/encoding/yaml.ts';

const source =
  'https://www.england.nhs.uk/coronavirus/publication/vaccination-sites/';

const page = await fetch(source);
const doc = new DOMParser().parseFromString(await page.text(), 'text/html')!;

const links = doc.querySelectorAll('a');

const excelLinks = Array.from(
  new Set(
    Array.from(links)
      .map((link: any) => link.attributes.href)
      .filter((x) => x.match(/xlsx/))
  )
);

if (excelLinks.length > 1) {
  console.log(`Found ${excelLinks.length} links`);
  excelLinks.forEach((x) => console.log(x));
  Deno.exit(1);
}

if (excelLinks.length < 1) {
  console.log(`Found ${excelLinks.length} links`);
  Deno.exit(1);
}

const excelLink = excelLinks[0];

const flatActionFile = './.github/workflows/flat.yml'

const action: any = parse(await Deno.readTextFile(flatActionFile));

action.env.VACCINATION_SITES = excelLink;

await Deno.writeTextFile(flatActionFile, stringify(action, { noCompatMode: true, lineWidth: 200 }));

