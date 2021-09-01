/**
  ODI Leeds MSOA Yorkshire and Humber data
  Version 0.1.1
**/
(function(root){
	
	var ODI = root.ODI || {};
	// Define a colour scale helper function
	function ColourScale(c){
		// Version 1.1
		var s,n;
		s = c;
		n = s.length;
		// Get a colour given a value, and the range minimum/maximum
		this.getValue = function(v,min,max,attr){
			if(!attr) attr = {};
			if(typeof v!=="number"){
				return attr.missing||'#999';
			}
			if(min==max) return attr.norange||'#999';
			var a,b,c,pc,rgb;
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
		this.makeGradient = function(){
			var grad = '';
			for(var i = 0; i < n;i++) grad += (grad ? ', ':'')+'rgb('+s[i].rgb.join(',')+') '+(s[i].v*100).toFixed(3).replace(/\.0+$/,"")+'%';
			return 'background: -moz-linear-gradient(left, '+grad+');background: -webkit-linear-gradient(left, '+grad+');background: linear-gradient(to right, '+grad+');';
		}
		return this;
	}

	// Define the Viridis colour scale
	var scales = {
		'viridis': new ColourScale([{'rgb':[68,1,84],v:0},{'rgb':[72,35,116],'v':0.1},{'rgb':[64,67,135],'v':0.2},{'rgb':[52,94,141],'v':0.3},{'rgb':[41,120,142],'v':0.4},{'rgb':[32,143,140],'v':0.5},{'rgb':[34,167,132],'v':0.6},{'rgb':[66,190,113],'v':0.7},{'rgb':[121,209,81],'v':0.8},{'rgb':[186,222,39],'v':0.9},{'rgb':[253,231,36],'v':1}],{missing:'#999'}),
		'diverging': new ColourScale([{'rgb':[202, 88, 0],v:0},{'rgb':[253, 191, 17],'v':0.125},{'rgb':[253, 216, 112],'v':0.25},{'rgb':[255, 242, 207],'v':0.375},{'rgb':[248, 248, 248],'v':0.5},{'rgb':[207, 232, 243],'v':0.625},{'rgb':[115, 191, 226],'v':0.75},{'rgb':[22, 150, 210],'v':0.875},{'rgb':[10, 76, 106],'v':1}],{missing:'#999'}),
		'divergingreverse': new ColourScale([{'rgb':[10, 76, 106],'v':0},{'rgb':[22, 150, 210],'v':0.125},{'rgb':[115, 191, 226],'v':0.25},{'rgb':[207, 232, 243],'v':0.375},{'rgb':[248, 248, 248],'v':0.5},{'rgb':[255, 242, 207],'v':0.625},{'rgb':[253, 216, 112],'v':0.75},{'rgb':[253, 191, 17],'v':0.875},{'rgb':[202, 88, 0],v:1},],{missing:'#999'})
	};
	var data = {};
	var options = {
		"IMD Score, 2019":{"range":[0,100]},
		"Income deprivation, English Indices of Deprivation, 2019":{"range":[0,null]},
		"Unemployment":{"range":[0,null]},
		"Long term unemployment":{"range":[0,null]},
		"Fuel Poverty, 2018":{"range":[0,null]},
		"Proportion of households in poverty":{"range":[0,null]},
		"Overcrowded houses, 2011":{"range":[0,null]},
		"Older people living alone":{"range":[0,null]},
		"Older People in Deprivation, Number of older people":{"range":[0,null]},
		"Older People in Deprivation, English Indices of Deprivation, 2019":{"range":[0,null]},
		"Child Poverty, English Indices of Deprivation, 2019":{"range":[0,null]},
		"Child Poverty, Number of children":{"range":[0,null]},
		"Total population":{"range":[0,null]},
		"Population density":{"range":[0,null]},
		"Population aged 0 to 4 years":{"range":[0,null]},
		"Population aged 0 to 15 years":{"range":[0,null]},
		"Population aged 5 to 15 years":{"range":[0,null]},
		"Population aged 16 to 24 years":{"range":[0,null]},
		"Population aged 25 to 64 years":{"range":[0,null]},
		"Population aged between 50 and 64 years":{"range":[0,null]},
		"Population aged 65 years and over":{"range":[0,null]},
		"Population aged 85 years and over":{"range":[0,null]},
		"Black and Minority Ethnic Population":{"range":[0,100]},
		"Population whose ethnicity is not 'White UK'":{"range":[0,100]},
		"Population who cannot speak English well or at all":{"range":[0,null]},
		"newCasesBySpecimenDateRollingSum":{"range":[0,null]},
		"newCasesBySpecimenDateChange":{"range":"symmetric","scale":"divergingreverse"},
		"newCasesBySpecimenDateRollingRate":{"range":[0,null]},
		"PCR - 7 days":{"range":[0,null]},
		"PCR per 100k - 7 days":{"range":[0,null]},
		"PCR positivity % - 7 days":{"range":[0,null]},
		"LFD":{"range":[0,null]},
		"LFD per 100k":{"range":[0,null]},
		"1st dose Under 18 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 18-24 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 25-29 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 30-34 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 35-39 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 40-44 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 45-49 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 50-54 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 55-59 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 60-64 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 65-69 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 70-74 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 75-79 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"1st dose 80+ %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose Under 18 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 18-24 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 25-29 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 30-34 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 35-39 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 40-44 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 45-49 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 50-54 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 55-59 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 60-64 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 65-69 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 70-74 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 75-79 %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"2nd dose 80+ %":{"format":function(v,props){ if(v==""){ return "{{n}}<br />Figures suppressed due to small numbers"; }else{ return "{{n}}<br />{{v}}% (as of {{Vac date}})<br />{{Vaccine notes}}"; }},"range":[0,100]},
		"Travel time by WALK":{"format":function(v,props){ if(v==""){ return "{{n}}<br />At least 60 mins"; }else{ return "{{n}}<br />{{v}} mins"; } },"missing":"#999","range":[0,60]},
		"Travel time by BICYCLE":{"format":function(v,props){ if(v==""){ return "{{n}}<br />At least 60 mins"; }else{ return "{{n}}<br />{{v}} mins"; } },"missing":"#999","range":[0,60]},
		"Travel time by TRANSIT,WALK":{"format":function(v,props){ if(v==""){ return "{{n}}<br />At least 60 mins"; }else{ return "{{n}}<br />{{v}} mins"; } },"missing":"#999","range":[0,60]},
		"Travel time by CAR":{"format":function(v,props){ if(v==""){ return "{{n}}<br />At least 60 mins"; }else{ return "{{n}}<br />{{v}} mins"; } },"missing":"#999","range":[0,60]}
	};
	

	function replacePattern(txt,props){
		for(var f in props) txt = replaceProperty(txt,f,props[f]);
		return txt;
	}
	function replaceProperty(txt,k,v){
		regex = new RegExp("{{"+k+"}}","g");
		return txt.replace(regex,v);
	}
	function getQueryVariables(){
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		var config = {};
		for(var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			config[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
		}
		return config;
	}

	function MSOA(){
		this.version = "0.1.1";
		this.hexmaps = {
			'a':{ 'el':document.getElementById('a'),'select':document.querySelector('#a select'),'key':document.querySelector('#a .key') },
			'b':{ 'el':document.getElementById('b'),'select':document.querySelector('#b select'),'key':document.querySelector('#b .key') }
		};
		this.correlation = {
			'el':document.getElementById('chart'),
			'data':{},
			'labels':{}
		};
		var ab;
		var config = getQueryVariables();
		for(ab in this.hexmaps){
			if(this.hexmaps[ab].select){
				// Update select value if provided in query string
				if(config['map-'+ab]) this.hexmaps[ab].select.value = config['map-'+ab];
				addEvent('change',this.hexmaps[ab].select,{ab:ab,me:this},function(e){
					e.data.me.updateHexmap(e.data.ab);
				});
				addEvent('mouseleave',this.hexmaps[ab].el,{me:this},function(e){ e.data.me.updateTips(); });
			}
		}

		for(ab in this.hexmaps){
			if(this.hexmaps[ab]){
				// Create the hexagon layout
				this.hexmaps[ab].map = new ODI.hexmap(this.hexmaps[ab].el.querySelector('.hexmap'),{
					// The HexJSON layout
					'hexjson':'data/msoa_yorkshireandhumber.hexjson',
					'ab': ab,
					'main':this,
					// Once we've loaded the map the ready function is called
					'ready':function(attr){
						this._attr.main.updateHexmap(this._attr.ab);
					}
				});

				// Make a tooltip
				this.hexmaps[ab].map.on('mouseover',{'ab':ab,me:this},function(e){ e.data.me.updateTips(e.data.region); });
			}
		}

		this.updateSelect = function(ab,v){
			if(ab != "a" && ab != "b"){
				console.error('AB is not valid',ab);
			}else{
				setOption(this.hexmaps[ab].select,v);
				this.updateHexmap(ab);
			}
			return this;
		};

		function setValues(ab,field){
			for(r in data){
				if(typeof field==="number") data[r][ab] = field;
				else if(typeof field==="string") data[r][ab] = data[r][field];
			}
			return;
		}
		function buildScale(scale,min,max){
			return '<div class="range"><div class="bar" style="'+scales[scale].makeGradient()+';"><div class="min">'+min+'</div><div class="max">'+max+'</div></span></div>';
		}		
		function copyLink() {
			// Get the text field
			var copyText = document.getElementById("link");
			// Select the text field
			copyText.select();
			// For mobile devices
			copyText.setSelectionRange(0, 99999);
			// Copy the text inside the text field
			document.execCommand("copy");
		}
		addEvent('click',document.getElementById('copy-link'),{},copyLink);
		this.updateLink = function(){
			if(document.getElementById('link')){
				lnk = '';
				for(var ab in this.hexmaps){
					lnk += (lnk ? '&':'')+'map-'+ab+'='+encodeURI(this.hexmaps[ab].select.value);
				}
				document.getElementById('link').value = location.origin+location.pathname+'?'+lnk;
			}
			return this;
		}
		this.updateCorrelation = function(){
			var nr,r,d,ab,i,corr,init,bad,axes;
			corr = [];
			init = (this.correlation.chart ? true : false);
			bad = 0;
			axes = {};
			nr = 0;
			for(r in this.correlation.data){
				if(typeof this.correlation.data[r].x==="number" && typeof this.correlation.data[r].y==="number") corr.push(this.correlation.data[r]);
				else bad++;
				nr++;
			}
			// If we have empty values we escape
			if(bad > 0 || nr==0){
				//console.error('Missing values',bad);
				return this;
			}
			for(ab in this.hexmaps){
				a = (ab=='a' ? 'y':'x');
				axes[a] = {
					'title':{'label':this.hexmaps[ab].select.options[this.hexmaps[ab].select.selectedIndex].innerHTML},
					'labels': this.correlation.labels[ab]
				}
			}

			if(!init){
				this.correlation.chart = ODI.linechart(this.correlation.el,{
					'left':32,
					'right':0,
					'top':0,
					'bottom':32,
					'axis':axes
				});
				this.correlation.chart.on('showtooltip',{this:this},function(e){
					var i,region;
					i = 0;
					region = "";
					for(r in data){
						if(i==e.i) region = r;
						i++;
					}
					if(region) this.updateTips(region,true);
				});
				this.correlation.chart.addSeries(corr,{
					'title': 'Correlation',
					'points':{ 'size':4, 'color': '#722EA5' },
					'line':{ 'show': false },
					'tooltip':{
						'label': function(d){
							return d.data.name+'\n'+d.data.xlabel+': '+d.data.x+'\n'+d.data.ylabel+': '+(d.data.yvalue||d.data.y);
						}
					}
				});
				this.correlation.chart.draw();
			}else{
				this.correlation.chart.setProperties({'axis':axes});
				this.correlation.chart.series[0].setData(corr);
				this.correlation.chart.draw();
			}
			return this;
		}

		this.updateHexmap = function(ab){
			var r,colours,attr,n,field,i,c,range;
			var min = 1e100;
			var max = -1e100;
			var cat = 0;
			var categories = {};
			var temp = {};
			var scale = 'viridis';
			if(this.hexmaps[ab].select){
				field = this.hexmaps[ab].select.value;
				n = 0;
				// Set empty correlation values
				if(this.correlation){
					for(r in data){
						if(!this.correlation.data[r]) this.correlation.data[r] = {};
						this.correlation.data[r].msoa = r;
						this.correlation.data[r].name = data[r].Name;
					}
				}
				this.hexmaps[ab].numeric = true;
				for(r in data){
					if(typeof data[r][field]==="string" && data[r][field].length > 0){
						cat++;
						if(!categories[data[r][field]]) categories[data[r][field]] = 0;
						categories[data[r][field]]++;
						this.hexmaps[ab].numeric = false;
					}else{
						if(this.correlation){
							this.correlation.data[r][(ab=='a'?'y':'x')] = data[r][field];
							this.correlation.data[r][(ab=='a'?'y':'x')+'label'] = this.hexmaps[ab].select.value;
						}
					}
					n++;
				}
				// If it is a category-based array we use the category integer value
				if(!this.hexmaps[ab].numeric && this.correlation){
					i = 0;
					for(c in categories){
						for(r in data){
							if(data[r][field]==c){
								this.correlation.data[r][ab=='a'?'y':'x'] = i;
								this.correlation.data[r][(ab=='a'?'y':'x')+'label'] = this.hexmaps[ab].select.value;
								this.correlation.data[r][(ab=='a'?'y':'x')+'value'] = data[r]['LTLA name'];
							}
						}
						i++;
					}
				}

				// If more than half the values seem to be categories
				if(cat > n/2){
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
						};
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
					setValues(ab,0);
					for(r in data) temp[r] = colours[data[r][field]]||'#444';
					// Update the key
					if(this.hexmaps[ab].key){
						this.hexmaps[ab].key.innerHTML = '';
					}
				}else{
					setValues(ab,field);

					for(r in data){
						min = Math.min(data[r][ab],min);
						max = Math.max(data[r][ab],max);
					}
					attr = {};
					if(options[field]){
						if(options[field].missing){
							attr.missing = options[field].missing;
							attr.norange = options[field].missing;
						}
						// If we've specified a range we use that
						if(options[field].range){
							if(typeof options[field].range==="object"){
								if(options[field].range[0]!=null) min = options[field].range[0];
								if(options[field].range[1]!=null) max = options[field].range[1];
							}else if(typeof options[field].range==="string"){
								if(options[field].range=="symmetric"){
									minmax = Math.max(Math.abs(min),Math.abs(max));
									max = minmax;
									min = -minmax;
									console.log(minmax);
								}
							}
						}
					}
					if(options[field] && options[field].scale) scale = options[field].scale;
					// Update hex map colours
					for(r in data) temp[r] = (!data[r] ? '#888' : scales[scale].getValue(data[r][ab],min,max,attr));
					// Update the key
					if(this.hexmaps[ab].key) this.hexmaps[ab].key.innerHTML = buildScale(scale,min,max);
				}
			}else{
				for(r in data){
					data[r][ab] = (typeof data[r].a==="number" ? data[r].a : 0) * (typeof data[r].b==="number" ? data[r].b : 0);
					min = Math.min(data[r][ab],min);
					max = Math.max(data[r][ab],max);
				}
				if(options[field] && options[field].scale) scale = options[field].scale;
				for(r in data){
					temp[r] = (!data[r] ? '#888' : scales[scale].getValue(data[r][ab],min,max,attr));
				}
				// Update the key
				if(this.hexmaps[ab].key) this.hexmaps[ab].key.innerHTML = buildScale(scale,min,max);
			}
			

			this.hexmaps[ab].map.updateColours(temp);

			// Update any tooltips
			this.updateTips(this.region);

			this.updateLink();
			
			if(this.correlation){
				this.correlation.labels[ab] = {};
				this.updateCorrelation();
			}
			return this;
		};
		this.updateTips = function(r,noupdate){
			if(!r){
				for(ab in this.hexmaps){
					if(this.hexmaps[ab].tip){
						this.hexmaps[ab].tip.parentNode.removeChild(this.hexmaps[ab].tip);
						delete this.hexmaps[ab].tip;
					}
				}
				this.region = "";
				if(this.correlation && this.correlation.chart) this.correlation.chart.series[0].selectItem(-1);
				return;
			}
			this.region = r;
			
			var svg,hex,v,bb,bbo,i;

			for(ab in this.hexmaps){
				svg = this.hexmaps[ab].map.el;
				hex = this.hexmaps[ab].map.areas[r].hex;
				// Get any existing tooltip for this hexmap
				this.hexmaps[ab].tip = svg.querySelector('.tooltip');
				if(!this.hexmaps[ab].tip){
					// Add a new tooltip
					this.hexmaps[ab].tip = document.createElement('div');
					this.hexmaps[ab].tip.classList.add('tooltip');
					svg.appendChild(this.hexmaps[ab].tip);
				}
				if(this.hexmaps[ab].select){

					v = this.hexmaps[ab].select.options[this.hexmaps[ab].select.selectedIndex].getAttribute('data-format');
					if(options[this.hexmaps[ab].select.value] && typeof options[this.hexmaps[ab].select.value].format==="function") v = options[this.hexmaps[ab].select.value].format;
					if(typeof v==="function") v = v.call(this,data[r][ab],data[r]);
					v = replaceProperty(v,'id',r);
					if(data[r]){
						v = replaceProperty(v,'v',data[r][this.hexmaps[ab].select.value]);
						v = replaceProperty(v,'n',data[r].Name);
						v = replacePattern(v,data[r]);
					}

					// Update contents of tooltip
					this.hexmaps[ab].tip.innerHTML = v;
				}else{
					this.hexmaps[ab].tip.innerHTML = data[r].Name+'<br />'+data[r][ab];
				}
				// Update position of tooltip
				bb = hex.getBoundingClientRect();
				bbo = svg.getBoundingClientRect();
				this.hexmaps[ab].tip.style.left = Math.round(bb.left + bb.width/2 - bbo.left + svg.scrollLeft)+'px';
				this.hexmaps[ab].tip.style.top = Math.round(bb.top + bb.height/2 - bbo.top)+'px';
			}
			
			i = 0;
			selected = -1;
			for(r2 in data){
				if(r==r2){
					selected = i;
					break;
				}
				i++;
			}
			if(!noupdate && this.correlation && this.correlation.chart) this.correlation.chart.series[0].selectItem(selected);
			return;
		};

		return this;
	}

	ODI.ready(function(){

		ODI.msoa = new MSOA();

		// Load the data
		ODI.ajax('data/msoa_lookup.csv',{
			'this': this, // Set the context to the hexmap
			'dataType':'text',
			'success':function(d){
				d = CSV2JSON(d);
				var i,p,v,vf;
				for(i = 0; i < d.length; i++){
					if(d[i].MSOA11CD){
						if(!data[d[i].MSOA11CD]) data[d[i].MSOA11CD] = {};
						for(p in d[i]){
							v = d[i][p];
							if(d[i][p]!=""){
								vf = parseFloat(d[i][p]);
								if(v==vf+'' || v==vf+'.0') v = vf;
							}
							data[d[i].MSOA11CD][p] = v;
						}
					}
				}
				for(ab in ODI.msoa.hexmaps) ODI.msoa.updateHexmap(ab);
			},
			'error':function(e,attr){ console.error('Unable to load ',attr.url,attr); }
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
	}

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
		var newdata = [];
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
									console.warn('Invalid date '+line[j]);
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

	function setOption(selectElement, value){
		var options = selectElement.options;
		for(var i = 0, optionsLength = options.length; i < optionsLength; i++){
			if(options[i].value == value){
				selectElement.selectedIndex = i;
				return true;
			}
		}
		return false;
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

})(window || this);
