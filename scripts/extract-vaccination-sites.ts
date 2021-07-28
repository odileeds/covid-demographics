import { xlsx, readXLSX, writeCSV } from 'https://deno.land/x/flat/mod.ts'

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

await writeCSV('./data/vaccination-centres.csv', data);