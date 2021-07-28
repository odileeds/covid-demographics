import { xlsx, readXLSX, writeJSON, writeCSV } from 'https://deno.land/x/flat/mod.ts'
import { bulkPostcodeLookup } from '../lib/postcode.ts';

const filename = Deno.args[0]

const workbook = await readXLSX(filename);

const lookups = [
  {
    sheet: 'Vaccination Centres',
    name: 'Site Name',
    postcode: 'Postcode',
  },
  {
    sheet: 'Pharmacies',
    name: 'Site Name',
    postcode: 'Postcode',
  },
  {
    sheet: 'GP-led vaccination services',
    name: 'Site Name',
    postcode: 'Postcode',
  },
  {
    sheet: 'Hospital Hubs',
    name: 'Trust or Site Name',
    postcode: 'Postcode',
  }
];

const getData = async (sheetName: string) => {
  const lookup: any = lookups.find(x => x.sheet === sheetName);

  const formatData = (row: any) => ({
    type: sheetName,
    name: row[lookup.name],
    postcode: row[lookup.postcode],
  });
  return (await xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])).map(formatData);
}

const data = (await Promise.all(workbook.SheetNames.map(getData)))
  .flat()

const postcodes = [...(new Set(data.map((row: any) => row.postcode)))];

const postcodeData = await bulkPostcodeLookup(postcodes);

const vaccinationCentreData = data.map((row: any) => {
  const location = postcodeData.find(p => p.postcode === row.postcode.trim());
  return {
    ...row,
    ...location,
  }
});

await writeCSV('./data/vaccination-centres.csv', vaccinationCentreData.filter(r => Boolean(r.msoa)));
await writeCSV('./data/vaccination-centres-invalid.csv', vaccinationCentreData.filter(r => !Boolean(r.msoa)));
