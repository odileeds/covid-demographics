#!/usr/bin/perl

my $dir;
BEGIN {
	$dir = $0;
	$dir =~ s/[^\/]*$//g;
	if(!$dir){ $dir = "./"; }
	$lib = $dir."lib/";
}
use lib $lib;
use Data::Dumper;
use JSON::XS;

$datadir = $dir."../data/";
$tempdir = $datadir."temp/";
$hexjson = $datadir."msoa_hex_coords.hexjson";
$hexjsonsmall = $datadir."msoa_yorkshireandhumber.hexjson";
$hexjsonsmalldet = $datadir."msoa_yorkshireandhumber-details.hexjson";
$traveltime = $tempdir."TravelTimesNorthEngland_MSOAtoMSOA_NoLatLng__ToArriveBy_0830am_20191009.csv";
$datafile = $datadir."msoa_lookup.csv";
$casesfile = $tempdir."cases-phe-msoa.csv";
$testsfile = $tempdir."tests-ltla.csv";
$nimsfile = $tempdir."NIMS-MSOA-population.csv";
$nimsLAfile = $tempdir."NIMS-LTLA-population.csv";


@keepvac = ('1st dose Under 18 %','1st dose 18-24 %','1st dose 25-29 %','1st dose 30-34 %','1st dose 35-39 %','1st dose 40-44 %','1st dose 45-49 %','1st dose 50-54 %','1st dose 55-59 %','1st dose 60-64 %','1st dose 65-69 %','1st dose 70-74 %','1st dose 75-79 %','1st dose 80+ %','2nd dose Under 18 %','2nd dose 18-24 %','2nd dose 25-29 %','2nd dose 30-34 %','2nd dose 35-39 %','2nd dose 40-44 %','2nd dose 45-49 %','2nd dose 50-54 %','2nd dose 55-59 %','2nd dose 60-64 %','2nd dose 65-69 %','2nd dose 70-74 %','2nd dose 75-79 %','2nd dose 80+ %');
@keeplocalhealth = ('Older People in Deprivation, Number of older people','Rural Urban Classification','IMD Score, 2019','Income deprivation, English Indices of Deprivation, 2019','Fuel Poverty, 2018','Older people living alone','Population aged 0 to 15 years','Population aged 0 to 4 years','Population aged 5 to 15 years','Population aged 16 to 24 years','Population aged 25 to 64 years','Population aged between 50 and 64 years','Population aged 65 years and over','Population aged 85 years and over','Black and Minority Ethnic Population',"Population whose ethnicity is not 'White UK'",'Population who cannot speak English well or at all','Child Poverty, English Indices of Deprivation, 2019','Older People in Deprivation, English Indices of Deprivation, 2019','Overcrowded houses, 2011','Proportion of households in poverty','Unemployment','Long term unemployment','Total population','Population aged 65 years and over','Income Deprivation, Number of people','Child Poverty, Number of children','Population density');
@keepcases = ('newCasesBySpecimenDateChange','newCasesBySpecimenDateRollingRate','newCasesBySpecimenDateRollingSum','cases-date');

if(!-d $tempdir){
	`mkdir $tempdir`;
}


##########################
# Read in HexJSON
open(FILE,$hexjson);
@lines = <FILE>;
close(FILE);
%ltlalookup = {};
%data;
@output = "";
@outputdet = "";
for($i = 0; $i < @lines; $i++){
	if($lines[$i] =~ /"msoa_code":"([^\"]*)"/){
		$id = $1;
		if($lines[$i] =~ /"region_nation":"Yorkshire and The Humber"/){
			push(@outputdet,$lines[$i]);
			$data{$id} = {};
			if($lines[$i] =~ s/\,"ltla_code":"([^\"]*)"//){
				$ltla = $1;
				$data{$id}{'ltla'} = $ltla;
				if(!$ltlalookup{$ltla}){
					$ltlalookup{$ltla} = {};
				}
				$ltlalookup{$ltla}{$id} = 1;
			}
			if($lines[$i] =~ s/\,"ltla_name":"([^\"]*)"//){
				$data{$id}{'ltla_name'} = $1;
			}
			if($lines[$i] =~ s/\,"utla_code":"([^\"]*)"//){
				$data{$id}{'utla'} = $1;
			}
			if($lines[$i] =~ s/\,"utla_name":"([^\"]*)"//){
				$data{$id}{'utla_name'} = $1;
			}
			if($lines[$i] =~ s/\,"msoa_name_hcl":"([^\"]*)"//){
				$data{$id}{'msoa_name_hcl'} = $1;
			}
			if($lines[$i] =~ s/\,"pcon_name_bestfit":"([^\"]*)"//){
				$data{$id}{'pcon_name_bestfit'} = $1;
			}

			# Remove fields
			$lines[$i] =~ s/\,+"(region_nation|pcon_code_bestfit|msoa_name_ons|map_group|pcon_code_bestfit|fid|bng_x|bng_y|ltla_code|utla_code|msoa_name_ons)":([^\,]*)//g;
			$lines[$i] =~ s/"msoa_code":"([^\"]*)"\,//g;
			# Add MSOA HCL name
			#$lines[$i] =~ s/\}/\,\"name\":\"$data{$id}{'msoa_name_hcl'}\"\}/;
			# Add LTLA
			#$lines[$i] =~ s/\}/\,\"LAD\":\"$data{$id}{'ltla'}\"\}/;
			push(@output,$lines[$i]);
		}
	}else{
		push(@output,$lines[$i]);
		push(@outputdet,$lines[$i]);
	}
}

# Only update if we haven't already got the processed versions
if(!-e $hexjsonsmall){
	# Save truncated HexJSON
	$str = join("",@output);
	$str =~ s/\,\n\}\}$/\n\}\}/;
	open(FILE,">",$hexjsonsmall);
	print FILE $str;
	close(FILE);
}
if(!-e $hexjsonsmalldet){
	$str = join("",@outputdet);
	$str =~ s/\,\n\}\}$/\n\}\}/;
	open(FILE,">",$hexjsonsmalldet);
	print FILE $str;
	close(FILE);
}

#################################
# Population (NIMS) for MSOAs
# If older than 3 days
if(!-e $nimsfile || (time() - (stat $nimsfile)[9] >= 3*86400)){
	$url = "https://raw.githubusercontent.com/odileeds/covid-19/main/vaccines/data/NIMS-MSOA-population.csv";
	print "Getting $url\n";
	`wget -q --no-check-certificate -O $nimsfile "$url"`;
}
if(!-e $nimsLAfile || (time() - (stat $nimsLAfile)[9] >= 3*86400)){
	$url = "https://raw.githubusercontent.com/odileeds/covid-19/main/vaccines/data/NIMS-LTLA-population.csv";
	print "Getting $url\n";
	`wget -q --no-check-certificate -O $nimsLAfile "$url"`;
}
%nims = getCSV($nimsfile,{'id'=>'MSOA11CD','map'=>{'MSOA Code'=>'MSOA11CD'}});
%nimsLA = getCSV($nimsLAfile,{'id'=>'LADCD','map'=>{'LTLA Code'=>'LADCD'}});
foreach $msoa (keys(%nims)){
	$nims{$msoa}{'All'} = $nims{$msoa}{'Under 18'}+$nims{$msoa}{'18+'};
	if(!$nims{$msoa}{'Under 25'}){
		$nims{$msoa}{'Under 25'} = $nims{$msoa}{'Under 18'}+$nims{$msoa}{'18-24'};
	}
	$nims{$msoa}{'18-24 pc'} = sprintf("%0.2f",100*$nims{$msoa}{'18-24'}/$nims{$msoa}{'All'});
}
foreach $ltla (keys(%nimsLA)){
	$nimsLA{$ltla}{'All'} = $nimsLA{$ltla}{'Under 18'}+$nimsLA{$ltla}{'18+'};
}


################################
# Test data
%testsLA;
%tests;
if(!-e $testsfile || (time() - (stat $testsfile)[9] >= 86400/2)){
	$url = "https://api.coronavirus.data.gov.uk/v2/data?areaType=ltla&metric=uniqueCasePositivityBySpecimenDateRollingSum&metric=uniquePeopleTestedBySpecimenDateRollingSum&metric=newLFDTests&format=csv";
	print "Getting $url\n";
	`wget -q --no-check-certificate -O $testsfile "$url"`;
}
open(FILE,$testsfile);
while(<FILE>){
	$line = $_;
	$line =~ s/[\n\r]//g;
	($areaCode,$areaName,$areaType,$date,$newLFDTests,$uniqueCasePositivityBySpecimenDateRollingSum,$uniquePeopleTestedBySpecimenDateRollingSum) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
	if(!$testsLA{$areaCode}){
		$testsLA{$areaCode} = {'dates'=>{},'recent'=>{'PCR'=>'','LFD'=>''}};
	}
	if(!$testsLA{$areaCode}{'dates'}{$date}){
		$testsLA{$areaCode}{'dates'}{$date} = {'LFD'=>-1,'PCR'=>-1,'positivity'=>-1};
	}
	if($newLFDTests ne ""){
		$testsLA{$areaCode}{'dates'}{$date}{'LFD'} = $newLFDTests;
		if($date gt $testsLA{$areaCode}{'recent'}{'LFD'}){
			$testsLA{$areaCode}{'recent'}{'LFD'} = $date;
		}
	}
	if($uniqueCasePositivityBySpecimenDateRollingSum ne ""){
		$testsLA{$areaCode}{'dates'}{$date}{'positivity'} = $uniqueCasePositivityBySpecimenDateRollingSum;
		if($date gt $testsLA{$areaCode}{'recent'}{'PCR'}){
			$testsLA{$areaCode}{'recent'}{'PCR'} = $date;
		}
	}
	if($uniquePeopleTestedBySpecimenDateRollingSum ne ""){
		$testsLA{$areaCode}{'dates'}{$date}{'PCR'} = $uniquePeopleTestedBySpecimenDateRollingSum;
		if($date gt $testsLA{$areaCode}{'recent'}{'PCR'}){
			$testsLA{$areaCode}{'recent'}{'PCR'} = $date;
		}
	}
}
close(FILE);
foreach $ltla (sort(keys(%testsLA))){
	if($ltlalookup{$ltla}){
		foreach $msoa (sort(keys(%{$ltlalookup{$ltla}}))){
			$pcrdate = $testsLA{$ltla}{'recent'}{'PCR'};
			$lfddate = $testsLA{$ltla}{'recent'}{'LFD'};
			$tests{$msoa} = {
				'LAD'=>$ltla,
				'positivity'=>$testsLA{$ltla}{'dates'}{$pcrdate}{'positivity'},
				'PCR'=>$testsLA{$ltla}{'dates'}{$pcrdate}{'PCR'},
				'PCRper100k'=>sprintf("%0.1f",$testsLA{$ltla}{'dates'}{$pcrdate}{'PCR'}*1e5/$nimsLA{$ltla}{'All'}),
				'PCRdate'=>$pcrdate,
				'LFD'=>$testsLA{$ltla}{'dates'}{$lfddate}{'LFD'},
				'LFDper100k'=>sprintf("%0.1f",$testsLA{$ltla}{'dates'}{$pcrdate}{'LFD'}*1e5/$nimsLA{$ltla}{'All'}),
				'LFDdate'=>$lfddate
			};
		}
	}
}


###############################
# Vaccine data - get the raw data and work out the percentages using the NIMS data
$url = "https://raw.githubusercontent.com/odileeds/covid-19/main/vaccines/data/vaccinations-MSOA-latest.csv";
$file = $datadir."temp/vaccine-MSOA-latest.csv";
# If the file doesn't exist or is older than 12 hours
if(!-e $file || (time() - (stat $file)[9] >= 86400/2)){
	print "Getting $url\n";
	`wget -q --no-check-certificate -O $file "$url"`;
}
%vaccines = getCSV($file,{'id'=>'MSOA11CD','map'=>{'MSOA Code'=>'MSOA11CD'}});
$url = "https://raw.githubusercontent.com/odileeds/covid-19/main/vaccines/data/vaccinations-MSOA-latest.txt";
$datevac = `wget -q --no-check-certificate -O- "$url"`;
foreach $msoa (sort(keys(%vaccines))){
	foreach $key (sort(keys(%{$vaccines{$msoa}}))){
		$r = "";
		if($key =~ /dose (Under [0-9]+)/){
			$r = $1;
		}
		if($key =~ /dose ([0-9\-\+]+)/){
			$r = $1;
		}
		if($r){
			if($nims{$msoa}{$r}==0){
				print "$msoa / $r / $nims{$msoa}{$r}\n";
			}
			$vaccines{$msoa}{$key." %"} = ($vaccines{$msoa}{$key} eq "" ? "" : sprintf("%0.1f",100*$vaccines{$msoa}{$key}/$nims{$msoa}{$r}));
		}
	}
}



#################################
# Cases data
%cases;
if(!-e $casesfile || (time() - (stat $casesfile)[9] >= 86400/2)){
	$url = "https://api.coronavirus.data.gov.uk/v2/data?areaType=msoa&areaCode=E12000003&metric=newCasesBySpecimenDateRollingRate&metric=newCasesBySpecimenDateChange&metric=newCasesBySpecimenDateRollingSum&format=csv";
	print "Getting $url\n";
	`wget -q --no-check-certificate -O $casesfile "$url"`;
}
open(FILE,$casesfile);
while(<FILE>){
	$line = $_;
	$line =~ s/[\n\r]//g;
	($regionCode,$regionName,$UtlaCode,$UtlaName,$LtlaCode,$LtlaName,$areaCode,$areaName,$areaType,$date,$newCasesBySpecimenDateChange,$newCasesBySpecimenDateRollingRate,$newCasesBySpecimenDateRollingSum) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
	if($data{$areaCode}){
		# Only take the first entry
		if(!$cases{$areaCode}){
			$cases{$areaCode} = {'cases-date'=>$date,'newCasesBySpecimenDateChange'=>$newCasesBySpecimenDateChange,'newCasesBySpecimenDateRollingRate'=>$newCasesBySpecimenDateRollingRate,'newCasesBySpecimenDateRollingSum'=>$newCasesBySpecimenDateRollingSum};
		}
	}
}
close(FILE);


#################################
# Travel times
#OriginName,DestinationName,Mode,Minutes
#E02002303,E02002604,CAR,60
%traveltimes;
if(!-e $traveltime){
	$url = "https://github.com/odileeds/OpenJourneyTime/raw/master/TravelTimesNorthEngland_MSOAtoMSOA_NoLatLng__ToArriveBy_0830am_20191009.csv";
	print "Getting $url\n";
	`wget -q --no-check-certificate -O $traveltime "$url"`;
}
%modes;
open(FILE,$traveltime);
$n = 0;
while(<FILE>){
	$line = $_;
	$line =~ s/[\n\r]//g;
	if($n > 0){
		($origin,$dest,$mode,$min) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
		$mode =~ s/(^\"|\"$)//g;
		if(!$modes{$mode}){ $modes{$mode} = 0; }
		$modes{$mode}++;
		if($data{$origin} && $data{$dest}){
			if(!$traveltimes{$origin}){ $traveltimes{$origin} = {}; }
			if(!$traveltimes{$origin}{$dest}){ $traveltimes{$origin}{$dest} = {}; }
			$traveltimes{$origin}{$dest}{$mode} = $min;
		}
	}
	$n++;
}
close(FILE);
#type,name,postcode,latitude,longitude,adminDistrict,msoa,lsoa
#Vaccination Centres,Airedale General Hospital,BD20 6TD,53.898015,-1.962695,E08000032,E02002186,E01010645
open(FILE,$datadir."vaccination-centres.csv");
@lines = <FILE>;
close(FILE);
%vacsites;
%travel;
# Set up null values
foreach $msoa (keys(%data)){
	$vacsites{$msoa} = 0;
	$travel{$msoa} = {};
	foreach $mode (keys(%modes)){
		$travel{$msoa}{$mode} = 1000;
	}
}
foreach $line (@lines){
	($typ,$name,$pc,$lat,$lon,$admin,$msoa,$lsoa) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
	$vacsites{$msoa}++;
}
# Calculate the minimum travel time for each MSOA
foreach $msoa (keys(%data)){
	# Loop over destinations
	foreach $dest (keys(%{$traveltimes{$msoa}})){
		# If there is a vaccination site at this destination we check it
		if($vacsites{$dest}){
			# Loop over the modes
			foreach $mode (keys(%{$traveltimes{$msoa}{$dest}})){
				# If using this mode to this destination is quicker than the existing minimum time we update it
				if($traveltimes{$msoa}{$dest}{$mode} < $travel{$msoa}{$mode}){ $travel{$msoa}{$mode} = $traveltimes{$msoa}{$dest}{$mode}; }
			}
		}
	}
}

#################################
# Local Health Data - PHE
%localhealth = getCSV($datadir."local-health-data.csv",{'id'=>'MSOA11CD','map'=>{'Code'=>'MSOA11CD'}});


#################################
# Save CSV
$csv = "MSOA11CD,Name,LTLA,LTLA name,UTLA,Vac date";
for($k = 0; $k < @keepvac; $k++){
	$csv .= "\,$keepvac[$k]";
}
for($k = 0; $k < @keeplocalhealth; $k++){
	$csv .= "\,\"$keeplocalhealth[$k]\"";
}
for($k = 0; $k < @keepcases; $k++){
	$csv .= "\,$keepcases[$k]";
}
#$csv .= ",Population 18-24 (%)";
$csv .= ",Vaccination sites";
foreach $mode (keys(%modes)){
	$csv .= ",\"Travel time by $mode\"";
}
$csv .= "\,PCR date\,PCR - 7 days\,PCR per 100k - 7 days,PCR positivity % - 7 days";
$csv .= "\,LFD date\,LFD\,LFD per 100k";
$csv .= "\n";
foreach $msoa (sort(keys(%data))){
	$csv .= "$msoa,\"$data{$msoa}{'msoa_name_hcl'}\",$data{$msoa}{'ltla'},\"$data{$msoa}{'ltla_name'}\",$data{$msoa}{'utla'},$datevac";
	for($k = 0; $k < @keepvac; $k++){
		$csv .= "\,$vaccines{$msoa}{$keepvac[$k]}";
	}
	for($k = 0; $k < @keeplocalhealth; $k++){
		$commas = $localhealth{$msoa}{$keeplocalhealth[$k]} =~ /\,/;
		$csv .= "\,".($commas ? "\"":"").$localhealth{$msoa}{$keeplocalhealth[$k]}.($commas ? "\"":"");
	}
	for($k = 0; $k < @keepcases; $k++){
		$csv .= "\,$cases{$msoa}{$keepcases[$k]}";
	}
	#$csv .= "\,".$nims{$msoa}{'18-24 pc'};
	$csv .= "\,".($vacsites{$msoa});
	foreach $mode (keys(%modes)){
		$csv .= "\,".($travel{$msoa}{$mode}==1000 ? '':$travel{$msoa}{$mode});
	}
	$csv .= "\,$tests{$msoa}{'PCRdate'}\,$tests{$msoa}{'PCR'}\,$tests{$msoa}{'PCRper100k'}\,$tests{$msoa}{'positivity'}";
	$csv .= "\,$tests{$msoa}{'LFDdate'}\,$tests{$msoa}{'LFD'}\,$tests{$msoa}{'LFDper100k'}";
	$csv .= "\n";
}

open(FILE,">",$datafile);
print FILE $csv;
close(FILE);
print "Saved data to $datafile\n";




##############################
# SUBROUTINES

sub getCSV {
	my (@lines,@header,%datum,$c,$i,$id,@data,%dat);
	my ($file, $props) = @_;

	# Open the file
	open(FILE,$file);
	@lines = <FILE>;
	close(FILE);
	$lines[0] =~ s/[\n\r]//g;
	@header = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$lines[0]);
	$id = -1;
	for($c = 0; $c < @header; $c++){
		$header[$c] =~ s/(^\"|\"$)//g;
		if($props->{'map'} && $props->{'map'}{$header[$c]}){
			$header[$c] = $props->{'map'}{$header[$c]};
		}
		if($props->{'id'} && $header[$c] eq $props->{'id'}){
			$id = $c;
		}
	}

	for($i = 1; $i < @lines; $i++){
		undef %datum;
		$lines[$i] =~ s/[\n\r]//g;
		(@cols) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$lines[$i]);
		for($c = 0; $c < @cols; $c++){
			#print "\t$i = $header[$c] = $cols[$c]\n";
			if($cols[$c] =~ /^" ?([0-9\,]+) ?"$/){
				$cols[$c] =~ s/(^" ?| ?"$)//g;
				$cols[$c] =~ s/\,//g;
			}
			$cols[$c] =~ s/(^\"|\"$)//g;
			if($header[$c] ne ""){
				$datum{$header[$c]} = $cols[$c];
			}
		}
		if($id >= 0){
			$dat{$cols[$id]} = {%datum};
		}else{
			push(@data,{%datum});
		}
	}
	if($id >= 0){
		return %dat;
	}else{
		return @data;
	}
}
