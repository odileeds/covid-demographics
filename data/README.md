# Data sources

## Vaccinations

Vaccination sites from [NHS England list of vaccination sites][VACC_SITES]

Vaccinations by age and MSOA from [NHS England][VACC_DATA] processed by ODI Leeds ([vaccines GeoJSON](https://odileeds.github.io/covid-19/vaccines/inc/vaccine-msoa.geojson); [Data Mapper](https://mapper.odileeds.org/?14/53.80544/-1.56469/covid-19-vaccine-nhs-msoa)).

## Demographic data

Local Health Data from the [PHE Local Health England dashnboard][PHE_LHE]

## Hex cartogram

The [hex cartogram layout](https://github.com/houseofcommonslibrary/uk-hex-cartograms-noncontiguous/blob/main/hexjson/msoa_hex_coords.hexjson) is designed by the House of Commons Library and is displayed using [ODI.hexmap.js](https://odileeds.github.io/odi.hexmap.js/).


## Travel times

[Travel times by MSOA](https://github.com/odileeds/OpenJourneyTime/blob/master/TravelTimesNorthEngland_MSOAtoMSOA_NoLatLng__ToArriveBy_0830am_20191009.csv) from OpenJourneyTime (see also [isochrones](https://imactivate.com/northernisochrones/)).


[VACC_SITES]: https://www.england.nhs.uk/coronavirus/publication/vaccination-sites/
[VACC_DATA]: https://www.england.nhs.uk/statistics/statistical-work-areas/covid-19-vaccinations/
[PHE_LHE]: https://www.localhealth.org.uk/#bbox=152591,713491,600265,529520&c=indicator&i=t1.older_dep_n&i2=t1.ruralurban&view=map7
