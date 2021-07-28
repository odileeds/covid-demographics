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
# Save CSV
$csv = "MSOA11CD,Name,LTLA,Vac date";
for($k = 0; $k < @keepvac; $k++){
	$csv .= "\,$keepvac[$k]";
}
$csv .= "\n";
foreach $msoa (sort(keys(%data))){
	$csv .= "$msoa,\"$data{$msoa}{'msoa_name_hcl'}\",$data{$msoa}{'ltla'},$datevac";
	for($k = 0; $k < @keepvac; $k++){
		$csv .= "\,$data{$msoa}{$keepvac[$k]}";
	}
	$csv .= "\n";
}
open(FILE,">",$datadir."msoa_lookup.csv");
print FILE $csv;
close(FILE);

