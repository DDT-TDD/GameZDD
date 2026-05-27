/*!
 * Pacman - HTML5 Game Engine
 * Copyright (c) 2016-present, HaoLe Zheng
 * Released under the MIT License.
 */

'use strict';

// requestAnimationFrame polyfill
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// Game Engine
var Game = function(id,params){
	params = params||{};
	var canvas = document.getElementById(id);
	canvas.width = params.width||800;
	canvas.height = params.height||600;
	canvas.style.cssText = 'border:1px solid #d3d3d3;background:#000;display:block;margin:0 auto;';
	var context = canvas.getContext('2d');
	var status = 0;
	var anims = {};
	var stages = [];
	var stage = null;

	var Item = function(params){
		this._params = params||{};
		this._id = 0;
		this._stage = null;
		this._settings = {
			x:params.x||0,
			y:params.y||0,
			width:params.width||0,
			height:params.height||0,
			type:params.type||0,
			color:params.color,
			status:params.status||1,
			orientation:params.orientation||0,
			speed:params.speed||0,
			frames:params.frames||1,
			times:0,
			timeout:0,
			control:{},
			update:params.update||function(){},
			draw:params.draw||function(){}
		};
		if(params.location){
			this._settings.coord = params.coord||{x:0,y:0};
			this._settings.location = params.location;
		}
		if(params.vector){
			this._settings.vector = params.vector;
		}
		for(var i in this._settings){
			this[i] = this._settings[i];
		}
		// Initialize x,y from coord if location is specified
		if(params.location && params.coord){
			var pos = params.location.coord2position(params.coord.x, params.coord.y);
			this.x = pos.x;
			this.y = pos.y;
			this._settings.x = pos.x;
			this._settings.y = pos.y;
			// Initialize coord property so it's available immediately
			this.coord = params.location.position2coord(this.x, this.y);
		}
		// else: item created without a map location (positional)
	};
	Item.prototype.bind = function(eventType,callback){
		if(this._stage){
			var item = this;
			var handler = function(e){
				callback.call(item,e);
			};
			this._stage._events.push({item:item,eventType:eventType,callback:callback,handler:handler});
			document.addEventListener(eventType,handler);
		}
		return this;
	};

	var Map = function(params){
		params = params||{};
		this.x = params.x||0;
		this.y = params.y||0;
		var sourceData = params.data||[];
		this.data = JSON.parse(JSON.stringify(sourceData));
		this._data = JSON.parse(JSON.stringify(this.data));
		this.y_length = this.data.length;
		this.x_length = this.data[0]?this.data[0].length:0;
		this.size = params.size||20;
		this.cache = params.cache||false;
		this.frames = params.frames||1;
		this.times = 0;
		this.update = params.update||function(){};
		this.draw = params.draw||function(){};
	};
	Map.prototype.get = function(x,y){
		if(x<0||x>=this.x_length||y<0||y>=this.y_length){
			return -1;
		}
		return this.data[y][x];
	};
	Map.prototype.set = function(x,y,value){
		if(this.x_length<0||x>=this.x_length||y<0||y>=this.y_length){
			return false;
		}
		this.data[y][x] = value;
	};
	Map.prototype.coord2position = function(cx,cy){
		return {
			x:this.x+cx*this.size+this.size/2,
			y:this.y+cy*this.size+this.size/2
		};
	};
	Map.prototype.position2coord = function(x,y){
		var fx = Math.abs(x-this.x)%this.size-this.size/2;
		var fy = Math.abs(y-this.y)%this.size-this.size/2;
		return {
			x:Math.floor((x-this.x)/this.size),
			y:Math.floor((y-this.y)/this.size),
			offset:Math.sqrt(fx*fx+fy*fy),
			change:function(){
				return !arguments.length?false:Math.abs(arguments[0]-this.x)+Math.abs(arguments[1]-this.y)==1;
			}
		};
	};
	Map.prototype.finder = function(params){
		var defaults = {
			map:this.data,
			start:{},
			end:{},
			type:'min'
		};
		for(var i in params){
			defaults[i] = params[i];
		}
		var s = defaults.start;
		var e = defaults.end;
		var map = defaults.map;
		var type = defaults.type;
		// Validate start and end coordinates and convert to integers
		if(typeof s.x === 'undefined' || typeof s.y === 'undefined' || 
		   typeof e.x === 'undefined' || typeof e.y === 'undefined'){
			return [];
		}
		// Floor fractional coordinates to integers for array indexing
		s.x = Math.floor(s.x);
		s.y = Math.floor(s.y);
		e.x = Math.floor(e.x);
		e.y = Math.floor(e.y);
		var x_length = map[0].length;
		var y_length = map.length;
		var path = [];
		var find = function(){
			var openList = [];
			var closeList = [];
			var result = [];
			var node = function(x,y,g,h,parent){
				var f = g+h;
				return {pos:{x:x,y:y},g:g,h:h,f:f,parent:parent};
			};
			openList.push(node(s.x,s.y,0,0,null));
			while(openList.length>0){
				var curNode = openList[0];
				var curIndex = 0;
				for(var i=0;i<openList.length;i++){
					if(openList[i].f<curNode.f){
						curNode = openList[i];
						curIndex = i;
					}
				}
				if(curNode.pos.x==e.x&&curNode.pos.y==e.y){
					result = [];
					result.unshift(curNode.pos);
					var targetParent = curNode.parent;
					while(targetParent!=null){
						result.unshift(targetParent.pos);
						targetParent = targetParent.parent;
					}
					result.shift();
					return result;
				}
				openList.splice(curIndex,1);
				closeList.push(curNode);
				var checks = [[0,-1],[1,0],[0,1],[-1,0]];
				for(var j=0;j<checks.length;j++){
					var check = checks[j];
					var checkX = curNode.pos.x+check[0];
					var checkY = curNode.pos.y+check[1];
					if(checkX<0||checkY<0||checkX>=x_length||checkY>=y_length){
						continue;
					}
					if(map[checkY][checkX]==1){
						continue;
					}
					var g = curNode.g+1;
					var h = Math.abs(checkX-e.x)+Math.abs(checkY-e.y);
					var check_node = node(checkX,checkY,g,h,curNode);
					if(!check_node || !check_node.pos){
						console.error('check_node creation failed:', {checkX, checkY, g, h});
						continue;
					}
					var isInOpenList = false;
					for(var k=0;k<openList.length;k++){
						if(!openList[k] || !openList[k].pos){
							console.error('openList['+k+'] invalid:', openList[k]);
							continue;
						}
						if(check_node.pos.x==openList[k].pos.x&&check_node.pos.y==openList[k].pos.y){
							isInOpenList = true;
							if(check_node.g<openList[k].g){
								openList[k].parent = check_node.parent;
								openList[k].g = check_node.g;
								openList[k].f = check_node.f;
							}
							break;
						}
					}
					if(isInOpenList){
						continue;
					}
					var isInCloseList = false;
					for(var l=0;l<closeList.length;l++){
						if(!closeList[l] || !closeList[l].pos){
							console.error('closeList['+l+'] invalid:', closeList[l]);
							continue;
						}
						if(check_node.pos.x==closeList[l].pos.x&&check_node.pos.y==closeList[l].pos.y){
							isInCloseList = true;
							break;
						}
					}
					if(isInCloseList){
						continue;
					}
					openList.push(check_node);
				}
			}
			return result;
		}();
		if(find.length>0){
			if(type=='min'){
				path = [find[0]];
			}else if(type=='next'){
				var dist = map.length+map[0].length;
				var max = 0;
				for(var i=0;i<find.length;i++){
					var cur_dist = Math.abs(find[i].x-s.x)+Math.abs(find[i].y-s.y);
					if(cur_dist<dist&&max<cur_dist){
						path = [find[i]];
					}
					if(cur_dist==max){
						path.push(find[i]);
					}
					max = Math.max(max,cur_dist);
				}
			}
		}
		return path;
	};

	var Stage = function(params){
		params = params||{};
		this._settings = {
			status:params.status||1,
			timeout:params.timeout||0,
			update:params.update||function(){},
			maps:[],
			items:[]
		};
		for(var i in this._settings){
			this[i] = this._settings[i];
		}
		this._events = [];
	};
	Stage.prototype.createItem = function(params){
		var item = new Item(params);
		item._id = this.items.length;
		item._stage = this;
		this.items.push(item);
		return item;
	};
	Stage.prototype.resetItems = function(){
		console.log('resetItems called!');
		for(var i=0;i<this.items.length;i++){
			var item = this.items[i];
			for(var j in item._settings){
				item[j] = item._settings[j];
			}
		}
	};
	Stage.prototype.getItemsByType = function(type){
		var items = [];
		for(var i=0;i<this.items.length;i++){
			if(this.items[i].type==type){
				items.push(this.items[i]);
			}
		}
		return items;
	};
	Stage.prototype.createMap = function(params){
		var map = new Map(params);
		this.maps.push(map);
		return map;
	};
	Stage.prototype.resetMaps = function(){
		for(var i=0;i<this.maps.length;i++){
			var map = this.maps[i];
			map.data = JSON.parse(JSON.stringify(map._data));
			map.y_length = map.data.length;
			map.x_length = map.data[0]?map.data[0].length:0;
			map.times = 0;
		}
	};
	Stage.prototype.bind = function(eventType,callback){
		var stage = this;
		var handler = function(e){
			if(stage===stage._game._stage){
				callback.call(stage,e);
			}
		};
		this._events.push({eventType:eventType,callback:callback,handler:handler});
		document.addEventListener(eventType,handler);
		return this;
	};
	Stage.prototype._game = null;

	this.start = function(){
		status = 1;
		var f = 0;
		var clock = Date.now();
		var loop = function(){
			if(!status){
				return;
			}
			f++;
			var now = Date.now();
			if(now-clock>=1000){
				clock = now;
				f = 0;
			}
			if(f<=60){
				context.clearRect(0,0,canvas.width,canvas.height);
				if(stage&&stage.status){
					stage.update();
					stage.maps.forEach(function(map){
						map.update();
						map.times++;
						if(map.times>=map.frames){
							map.times = 0;
						}
						if(!map.cache){
							map.draw(context);
						}else{
							if(!anims[map.cache]){
								var cvs = document.createElement('canvas');
								cvs.width = map.x_length*map.size;
								cvs.height = map.y_length*map.size;
								var ctx = cvs.getContext('2d');
								ctx.translate(-map.x,-map.y);
								map.draw(ctx);
								anims[map.cache] = cvs;
							}
							context.drawImage(anims[map.cache],map.x,map.y);
						}
					});
					stage.items.forEach(function(item){
						if(stage.status==1){
							if(item.timeout>0){
								item.timeout--;
							}
							item.update();
						}
						item.times++;
						if(item.times>=item.frames){
							item.times = 0;
						}
						if(item.location){
							item.coord = item.location.position2coord(item.x,item.y);
							item.coord.change = item.coord.change(item.vector.x,item.vector.y);
						}
						item.draw(context);
					});
					if(stage.timeout>0){
						stage.timeout--;
					}
				}
			}
			anims.request = requestAnimationFrame(loop);
		};
		loop();
	};
	this.stop = function(){
		status = 0;
		cancelAnimationFrame(anims.request);
	};
	this.getPosition = function(){
		var box = canvas.getBoundingClientRect();
		return {
			x:box.left,
			y:box.top
		};
	};
	this.createStage = function(params){
		var stage = new Stage(params);
		stage._game = this;
		stages.push(stage);
		return stage;
	};
	this.setStage = function(index){
		if(stage&&stage._events){
			stage._events.forEach(function(event){
				document.removeEventListener(event.eventType,event.handler);
			});
		}
		stage = stages[index];
		this._stage = stage;
		stage.resetMaps();
		stage.resetItems();
	};
	this.nextStage = function(){
		if(stage){
			var index = stages.indexOf(stage);
			index++;
			if(index>=stages.length){
				index = 0;
			}
			this.setStage(index);
		}
	};
	this.getStages = function(){
		return stages;
	};
	this.init = function(){
		this.start();
		this.setStage(0);
	};
	this.canvas = canvas;
	this.context = context;
	this.width = canvas.width;
	this.height = canvas.height;
};
