// Define a colour scale helper function
function ColourScale(c){
	var s,n;
	s = c;
	n = s.length;
	// Get a colour given a value, and the range minimum/maximum
	this.getValue = function(v,min,max){
		var c,a,b;
		v = (v-min)/(max-min);
		if(v<0) return 'rgb('+s[0].rgb.join(',')+')';
		if(v>=1) return 'rgb('+s[n-1].rgb.join(',')+')';
		for(c = 0; c < n-1; c++){
			a = s[c];
			b = s[c+1];
			if(v >= a.v && v < b.v){
				pc = Math.min(1,(v - a.v)/(b.v-a.v));
				rgb = [Math.round(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc),Math.round(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc),Math.round(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)];
				return 'rgb('+rgb.join(',')+')';
			}
		}
	};
	return this;
}

// Define the Viridis colour scale
viridis = new ColourScale([{'rgb':[68,1,84],v:0},{'rgb':[72,35,116],'v':0.1},{'rgb':[64,67,135],'v':0.2},{'rgb':[52,94,141],'v':0.3},{'rgb':[41,120,142],'v':0.4},{'rgb':[32,143,140],'v':0.5},{'rgb':[34,167,132],'v':0.6},{'rgb':[66,190,113],'v':0.7},{'rgb':[121,209,81],'v':0.8},{'rgb':[186,222,39],'v':0.9},{'rgb':[253,231,36],'v':1}]);
var region,data,hexmaps,h;
data = {};

function updateHexmap(ab){
	var min = 1e100;
	var max = -1e100;
	var cat = 0;
	var categories = {};
	var field = hexmaps[ab].select.value;
	var n = 0;
	for(var r in data){
		if(typeof data[r][field]==="string"){
			cat++;
			if(!categories[data[r][field]]) categories[data[r][field]] = 0;
			categories[data[r][field]]++;
		}
		n++;
	}
	if(cat > 0){
		console.log(categories,cat,n)
		if(field=="LTLA"){
			colours = {
				'E08000016':'#67E767',
				'E08000017':'#00B6FF',
				'E08000018':'#E6007C',
				'E08000019':'#08DEF9',
				'E08000032':'#D73058',
				'E08000033':'#0DBC37',
				'E08000034':'#2254F4',
				'E08000035':'#F9BC26',
				'E08000036':'#722EA5',
				'E06000010':'#178CFF',
				'E06000011':'#1DD3A7',
				'E06000012':'#EF3AAB',
				'E06000013':'#FF6700',
				'E06000014':'#0DBC37',
				'E07000163':'#67E767',
				'E07000164':'#F9BC26',
				'E07000165':'#2254F4',
				'E07000166':'#D73058',
				'E07000167':'#00B6FF',
				'E07000168':'#EF3AAB',
				'E07000169':'#D60303'
			}
		}else if(field=="Rural Urban Classification"){
			colours = {
				'Rural village and dispersed in a sparse setting':'#01665e',
				'Rural village and dispersed':'#35978f',
				'Rural town and fringe in a sparse setting':'#80cdc1',
				'Rural town and fringe':'#c7eae5',
				'Urban minor conurbation':'#f6e8c3',
				'Urban city and town in a sparse setting':'#dfc27d',
				'Urban city and town':'#bf812d',
				'Urban major conurbation':'#8c510a'
			};
		}
		hexmaps[ab].map.updateColours(function(r){ return colours[data[r][field]]||'#444'; });
	}else{
		//Urban minor conurbation
		for(var r in data){
			min = Math.min(data[r][field],min);
			max = Math.max(data[r][field],max);
		}
		// Update hex map colours
		hexmaps[ab].map.updateColours(function(r){ return viridis.getValue(data[r][field],min,max); });
	}
	// Update any tooltips
	updateTips(region);
}
function updateTips(r){
	if(!r){
		for(ab in hexmaps){
			if(hexmaps[ab].tip){
				hexmaps[ab].tip.parentNode.removeChild(hexmaps[ab].tip);
				delete hexmaps[ab].tip;
			}
		}
		region = "";
		return;
	}
	region = r;
	
	var svg,hx,hex;

	for(ab in hexmaps){
		hx = hexmaps[ab];
		svg = hx.map.el;
		hex = hx.map.areas[r].hex;
		// Get any existing tooltip for this hexmap
		hx.tip = svg.querySelector('.tooltip');
		if(!hx.tip){
			// Add a new tooltip
			hx.tip = document.createElement('div');
			hx.tip.classList.add('tooltip');
			svg.appendChild(hx.tip);
		}
		format = hx.select.options[hx.select.selectedIndex].getAttribute('data-format');
		v = data[r][hx.select.value];
		v = format.replace(/\{\{v\}\}/g,v);
		for(f in data[r]){
			regex = new RegExp("{{"+f+"}}","g");
			v = v.replace(regex,data[r][f]);
		}
		// Update contents of tooltip
		hx.tip.innerHTML = data[r].Name+'<br />'+v;
		// Update position of tooltip
		bb = hex.getBoundingClientRect();
		bbo = svg.getBoundingClientRect();
		hx.tip.style.left = Math.round(bb.left + bb.width/2 - bbo.left + svg.scrollLeft)+'px';
		hx.tip.style.top = Math.round(bb.top + bb.height/2 - bbo.top)+'px';
	}
	return;
}


ODI.ready(function(){
	var h = 0;
	hexmaps = {
		'a':{ 'el':document.getElementById('a') },
		'b':{ 'el':document.getElementById('b') }
	};
	for(h in hexmaps){
		hexmaps[h].select = hexmaps[h].el.querySelector('select');
		addEvent('change',hexmaps[h].select,{h:h},function(e){ updateHexmap(e.data.h); });
		addEvent('mouseleave',hexmaps[h].el,{},function(e){ updateTips(); });
	}


	// Load the data
	ODI.ajax('data/msoa_lookup.csv',{
		'this': this, // Set the context to the hexmap
		'dataType':'text',
		'success':function(d){
			d = CSV2JSON(d);
			for(i = 0; i < d.length; i++){
				if(d[i].MSOA11CD){
					if(!data[d[i].MSOA11CD]) data[d[i].MSOA11CD] = {};
					for(p in d[i]){
						v = d[i][p];
						vf = parseFloat(d[i][p]);
						if(v==vf+'' || v==vf+'.0') v = vf;
						data[d[i].MSOA11CD][p] = v;
					}
				}
			}

			for(ab in hexmaps){
				// Create the hexagon layout
				hexmaps[ab].map = new ODI.hexmap(hexmaps[ab].el.querySelector('.hexmap'),{
					// The HexJSON layout
					'hexjson':'data/msoa_yorkshireandhumber.hexjson',
					'ab': ab,
					// Once we've loaded the map the ready function is called
					'ready':function(attr){
						updateHexmap(this._attr.ab);
					}
				});

				// Make a tooltip
				hexmaps[ab].map.on('mouseover',{'ab':ab},function(e){ updateTips(e.data.region); });
			}
		},
		'error':function(e,attr){ this.log('ERROR','Unable to load ',attr.url,attr); }
	});
});

// Return array of string values, or NULL if CSV string not well formed.
function CSVtoArray(text) {
	var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
	var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
	// Return NULL if input string is not well formed CSV string.
	if (!re_valid.test(text)) return null;
	var a = [];					 // Initialize array to receive values.
	text.replace(re_value, // "Walk" the string using replace with callback.
		function(m0, m1, m2, m3) {
			// Remove backslash from \' in single quoted values.
			if	  (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
			// Remove backslash from \" in double quoted values.
			else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
			else if (m3 !== undefined) a.push(m3);
			return ''; // Return empty string.
		});
	// Handle special case of empty last value.
	if (/,\s*$/.test(text)) a.push('');
	return a;
};

function CSV2JSON(data,format,start,end){

	if(typeof start!=="number") start = 1;
	var delim = ",";

	if(typeof data==="string"){
		data = data.replace(/\r/,'');
		data = data.split(/[\n]/);
	}
	if(typeof end!=="number") end = data.length;

	if(data[0].indexOf("\t") > 0) delim = /\t/;
	var header = CSVtoArray(data[0]);
	var simpleheader = JSON.parse(JSON.stringify(header));
	var line,datum,key,key2,f,i;
	var newdata = new Array();
	var lookup = {};
	// Work out a simplified (no spaces, all lowercase) version of the 
	// keys for matching against column headings.
	if(format){
		for(i in format){
			key = i.replace(/ /g,"").toLowerCase();
			lookup[key] = i+'';
		}
		for(i = 0; i < simpleheader.length; i++) simpleheader[i] = simpleheader[i].replace(/ /g,"").toLowerCase();
	}
	for(i = start; i < end; i++){
		line = CSVtoArray(data[i]);
		datum = {};
		if(line){
			for(var j=0; j < line.length; j++){
				key = header[j];
				key2 = simpleheader[j];
				if(format && lookup[key2]){
					key = lookup[key2];
					f = format[key];
					if(format[key].name) key = format[key].name;
					if(f.format=="number"){
						if(line[j]!=""){
							if(line[j]=="infinity" || line[j]=="Inf") datum[key] = Number.POSITIVE_INFINITY;
							else datum[key] = parseFloat(line[j]);
						}
					}else if(f.format=="eval"){
						if(line[j]!="") datum[key] = eval(line[j]);
					}else if(f.format=="date"){
						if(line[j]){
							line[j] = line[j].replace(/^"/,"").replace(/"$/,"");
							try {
								datum[key] = new Date(line[j]);
							}catch(err){
								this.log.warning('Invalid date '+line[j]);
								datum[key] = new Date('0001-01-01');
							}
						}else datum[key] = null;
					}else if(f.format=="boolean"){
						if(line[j]=="1" || line[j]=="true" || line[j]=="Y") datum[key] = true;
						else if(line[j]=="0" || line[j]=="false" || line[j]=="N") datum[key] = false;
						else datum[key] = null;
					}else{
						datum[key] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];
					}
				}else{
					datum[key] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];
				}
			}
			newdata.push(datum);
		}
	}
	return newdata;
}

function addEvent(ev,el,attr,fn){
	if(el){
		if(el.tagName) el = [el];
		if(typeof fn==="function"){
			el.forEach(function(elem){
				elem.addEventListener(ev,function(e){
					e.data = attr;
					fn.call(attr['this']||this,e);
				});
			});
		}
	}
}