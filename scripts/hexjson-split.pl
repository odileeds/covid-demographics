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
$hexjson = $datadir."msoa_hex_coords.hexjson";
$hexjsonsmall = $datadir."msoa_yorkshireandhumber.hexjson";



open(FILE,$hexjson);
@lines = <FILE>;
close(FILE);

@keepvac = ('1st dose 0-24 %','1st dose 25-29 %','1st dose 30-34 %','1st dose 35-39 %','1st dose 40-44 %','1st dose 45-49 %','1st dose 50-54 %','1st dose 55-59 %','1st dose 60-64 %','1st dose 65-69 %','1st dose 70-74 %','1st dose 75-79 %','1st dose 80+ %','2nd dose 0-24 %','2nd dose 25-29 %','2nd dose 30-34 %','2nd dose 35-39 %','2nd dose 40-44 %','2nd dose 45-49 %','2nd dose 50-54 %','2nd dose 55-59 %','2nd dose 60-64 %','2nd dose 65-69 %','2nd dose 70-74 %','2nd dose 75-79 %','2nd dose 80+ %');
@keeplocalhealth = ('Older People in Deprivation, Number of older people','Rural Urban Classification','IMD Score, 2019','Income deprivation, English Indices of Deprivation, 2019','Fuel Poverty, 2018','Older people living alone','Population aged 0 to 15 years','Population aged 0 to 4 years','Population aged 5 to 15 years','Population aged 16 to 24 years','Population aged 25 to 64 years','Population aged between 50 and 64 years','Population aged 65 years and over','Population aged 85 years and over','Black and Minority Ethnic Population',"Population whose ethnicity is not 'White UK'",'Population who cannot speak English well or at all','Child Poverty, English Indices of Deprivation, 2019','Older People in Deprivation, English Indices of Deprivation, 2019','Overcrowded houses, 2011','Proportion of households in poverty','Unemployment','Long term unemployment','Total population','Population aged 65 years and over','Income Deprivation, Number of people','Child Poverty, Number of children','Population density');

%data;
@output = "";
for($i = 0; $i < @lines; $i++){
	if($lines[$i] =~ /"msoa_code":"([^\"]*)"/){
		$id = $1;
		if($lines[$i] =~ /"region_nation":"Yorkshire and The Humber"/){
			$data{$id} = {};
			if($lines[$i] =~ s/\,"ltla_code":"([^\"]*)"//){
				$data{$id}{'ltla'} = $1;
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
	}
}

# Save truncated HexJSON
$str = join("",@output);
$str =~ s/\,\n\}\}$/\n\}\}/;
open(FILE,">",$hexjsonsmall);
print FILE $str;
close(FILE);


$url = "https://odileeds.github.io/covid-19/vaccines/inc/vaccine-msoa.geojson";
$file = $datadir."temp/vaccine-msoa.geojson";
# If the file doesn't exist or is older than 12 hours
if(!-e $file || (time() - (stat $file)[9] >= 86400/2)){
	print "Getting $url\n";
	`wget -q --no-check-certificate -O $file "$url"`;
}
# Get the populations data
open(FILE,$file);
@lines = <FILE>;
close(FILE);
$geojson = JSON::XS->new->utf8->decode(join("\n",@lines));
$datevac = $geojson->{'updated'};
@features = @{$geojson->{'features'}};
for($i = 0; $i < @features; $i++){
	$msoa = $features[$i]{'properties'}{'MSOA11CD'};
	if($data{$msoa}){
		for($k = 0; $k < @keepvac; $k++){
			$data{$msoa}{$keepvac[$k]} = $features[$i]{'properties'}{$keepvac[$k]};
		}
	}else{
		delete $geojson->{'features'}[$i];
	}
}

$txt = JSON::XS->new->utf8->pretty->allow_nonref->encode($geojson);


#################################
# IMD data
%imd = getCSV($datadir."local-health-tidy.csv",{'id'=>'MSOA11CD','map'=>{'Code'=>'MSOA11CD','Income deprivation, English Indices of Deprivation, 2019'=>'Income deprivation'}});
%localhealth = getCSV($datadir."local-health-data.csv",{'id'=>'MSOA11CD','map'=>{'Code'=>'MSOA11CD'}});


#################################
# Save CSV
$csv = "MSOA11CD,Name,LTLA,Vac date";
for($k = 0; $k < @keepvac; $k++){
	$csv .= "\,$keepvac[$k]";
}
for($k = 0; $k < @keeplocalhealth; $k++){
	$csv .= "\,\"$keeplocalhealth[$k]\"";
}
$csv .= "\n";
foreach $msoa (sort(keys(%data))){
	$csv .= "$msoa,\"$data{$msoa}{'msoa_name_hcl'}\",$data{$msoa}{'ltla'},$datevac";
	for($k = 0; $k < @keepvac; $k++){
		$csv .= "\,$data{$msoa}{$keepvac[$k]}";
	}
	for($k = 0; $k < @keeplocalhealth; $k++){
		$commas = $localhealth{$msoa}{$keeplocalhealth[$k]} =~ /\,/;
		$csv .= "\,".($commas ? "\"":"").$localhealth{$msoa}{$keeplocalhealth[$k]}.($commas ? "\"":"");
	}
	$csv .= "\n";
}
open(FILE,">",$datadir."msoa_lookup.csv");
print FILE $csv;
close(FILE);




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
