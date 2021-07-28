export type PostcodeLookupResponse = {
  postcode: string;
  longitude: string;
  latitude: string;
  adminDistrict: string;
  msoa: string;
  lsoa: string;
}

export async function bulkPostcodeLookup(postcodes: string[]) {
  const batches = [];
  const batchSize = 100;
  for (let i = 0; i < postcodes.length; i += batchSize) {
    batches.push(postcodes.slice(i, i + batchSize));
  }

  const postcodeApiCall = async (postcodes: any): Promise<PostcodeLookupResponse[]> => fetch('https://api.postcodes.io/postcodes/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      postcodes
    }),
  })
    .then((response: any) => response.json())
    .then((json: any) => json.result);

  return (await Promise.all(batches.map(postcodeApiCall))).flat()
    .map((result: any) => {
      if (!Boolean(result.result)) {
        console.error(`Postcode ${result.query} not found`);
        return;
      }

      return {
        postcode: result.result.postcode,
        latitude: result.result.latitude,
        longitude: result.result.longitude,
        adminDistrict: result.result.codes.admin_district,
        msoa: result.result.codes.msoa,
        lsoa: result.result.codes.lsoa,
      }
    })
    .filter(Boolean) as PostcodeLookupResponse[];
}