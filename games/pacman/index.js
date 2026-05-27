// Main game logic for Pac-Man
(function(){
	var _COIGIG = [		// Levels
		{				// Level 1
			'map':[		// Map data
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,1,1],
				[0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			'wall_color':'#09f',
			'goods':{		// Power pellets
				'1,3':1,
				'26,3':1,
				'1,23':1,
				'26,23':1
			}
		},
		{				// Level 2 - Harder
			'map':[
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,1],
				[1,0,1,0,0,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,0,0,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0,1],
				[1,1,0,0,0,0,1,1,0,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,0,0,1,1],
				[1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,1,1],
				[0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0],
				[1,1,1,1,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			'wall_color':'#09f',
			'goods':{
				'1,3':1,
				'26,3':1,
				'1,23':1,
				'26,23':1
			}
		},
		{				// Level 3 - Expert
			'map':[
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,0,1,0,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
				[1,1,0,1,1,1,0,1,1,1,1,1,1,0,1,0,1,1,1,0,1,1,0,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,1,1],
				[0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0],
				[1,1,1,1,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			'wall_color':'#09f',
			'goods':{		//能量豆
				'1,3':1,
				'26,3':1,
				'1,28':1,
				'26,28':1
			}
		},
		{				//第5关
			'map':[		//地图数据
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,0,1,1,1,1,1,0,1,1,0,0,0,0,1,1,0,1,1,1,1,1,0,1,1,1],
				[1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,0,1],
				[1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,0,0,0,0,0,1],
				[1,1,1,0,1,1,1,1,1,0,1,2,2,2,2,2,2,1,0,1,1,1,1,1,0,1,1,1],
				[1,1,1,0,1,1,1,1,1,0,1,2,2,2,2,2,2,1,0,1,1,1,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1],
				[0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
				[1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			'wall_color':'#5ED5D1',
			'goods':{		//能量豆
				'1,3':1,
				'26,3':1,
				'1,27':1,
				'26,27':1
			}
		},
		{				//第6关
			'map':[		//地图数据
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1],
				[1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
				[1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
				[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			'wall_color':'#C9C',
			'goods':{		//能量豆
				'1,3':1,
				'26,3':1,
				'1,24':1,
				'26,24':1
			}
		},
		{				//第8关
			'map':[		//地图数据
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,1,1,0,1],
				[1,0,1,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1,1,0,1],
				[1,0,1,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1,1,0,1],
				[0,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,0],
				[1,0,1,1,1,1,0,1,1,0,1,1,0,0,0,0,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			'wall_color':'#EB3F2F',
			'goods':{		//能量豆
				'1,4':1,
				'26,4':1,
				'1,25':1,
				'26,25':1
			}
		},
		{				//第9关
			'map':[		//地图数据
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,1,1,0,1],
				[1,0,1,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1,1,0,1],
				[1,0,1,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1,1,0,1],
				[1,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			'wall_color':'#56A36C',
			'goods':{		//能量豆
				'1,3':1,
				'26,3':1,
				'1,28':1,
				'26,28':1
			}
		},
		{				//第12关
			'map':[		//地图数据
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,0,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,0,1,1,0,1],
				[1,0,1,1,0,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,0,1,1,0,1],
				[1,0,1,1,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,0,0,0,0,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,0,0,0,0,1],
				[1,1,1,0,1,1,1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1,1,1,0,1,1,1],
				[1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
				[1,1,1,0,0,0,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,2,2,2,2,2,2,1,0,1,1,0,1,1,1,1,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
				[1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
				[1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			'wall_color':'#EB3F2F',
			'goods':{		//能量豆
				'1,4':1,
				'26,4':1,
				'1,25':1,
				'26,25':1
			}
		}
	];
	_COLOR = ['#F00','#F93','#0CF','#F9C'],	// NPC colors
	_COS = [1,0,-1,0],
	_SIN = [0,1,0,-1],
	_LIFE = 5,				// Player lives
	_SCORE = 0;				// Player score

	var game = new Game('gameCanvas', {width:800, height:600});

	// Start screen
	(function(){
		var stage = game.createStage();
		// Logo
		stage.createItem({
			x:game.width/2,
			y:game.height*.35,
			width:100,
			height:100,
			frames:3,
			draw:function(context){
				var t = Math.abs(5-this.times%10);
				context.fillStyle = '#FFE600';
				context.beginPath();
				context.arc(this.x,this.y,this.width/2,t*.04*Math.PI,(2-t*.04)*Math.PI,false);
				context.lineTo(this.x,this.y);
				context.closePath();
				context.fill();
				context.fillStyle = '#000';
				context.beginPath();
				context.arc(this.x+5,this.y-27,7,0,2*Math.PI,false);
				context.closePath();
				context.fill();
			}
		});
		// Game name
		stage.createItem({
			x:game.width/2,
			y:game.height*.5,
			draw:function(context){
				context.font = '36px PressStart2P';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillStyle = '#FFF';
				context.fillText('Pac-Man',this.x,this.y);
			}
		});
		// Hint
		stage.createItem({
			x:game.width/2,
			y:game.height*.64,
			frames:28,
			draw:function(context){
				if(this.times%2){
					context.font = '14px PressStart2P';
					context.textAlign = 'center';
					context.textBaseline = 'middle';
					context.fillStyle = '#AAA';
					context.fillText('Press Enter to start',this.x,this.y);
				}
			}
		});
		//copyright
		stage.createItem({
			x:game.width-10,
			y:game.height-5,
			draw:function(context){
				var text = 'Pac-Man Classic';
				context.font = '12px PressStart2P';
				context.textAlign = 'right';
				context.textBaseline = 'top';
				context.fillStyle = '#AAA';
				this.x = game.width-10;
				this.y = game.height-20-5;
				context.fillText(text,this.x,this.y);
			}
		});
		// Events
		stage.bind('keydown',function(e){
			switch(e.keyCode){
				case 13:
				game.nextStage();
				break;
			}
		});
	})();

	// Main game
	(function(){
		_COIGIG.forEach(function(config,index){
			var stage,map,beans,items,player;
			stage = game.createStage({
				update:function(){
					var stage = this;
					if(stage.status==1){								// Stage running
						items.forEach(function(item){
							if(map&&!map.get(item.coord.x,item.coord.y)&&!map.get(player.coord.x,player.coord.y)){
								var dx = item.x-player.x;
								var dy = item.y-player.y;
								if(dx*dx+dy*dy<750&&item.status!=4){		// Collision detection
									if(item.status==3){
										item.status = 4;
										_SCORE += 10;
									}else{
										stage.status = 3;
										stage.timeout = 30;
									}
								}
							}
						});
						if(JSON.stringify(beans.data).indexOf(0)<0){	// Level complete
							game.nextStage();
						}
					}else if(stage.status==3){		// Temporary state
						if(!stage.timeout){
							_LIFE--;
							if(_LIFE){
								stage.resetItems();
							}else{
								var stages = game.getStages();
								game.setStage(stages.length-1);
								return false;
							}
						}
					}
				}
			});
			
			// Draw map (adapted for 800x600 canvas)
			map = stage.createMap({
				x:60,
				y:10,
				data:config['map'],
				size:18,
				cache:true,
				draw:function(context){
					context.lineWidth = 2;
					for(var j=0; j<this.y_length; j++){
						for(var i=0; i<this.x_length; i++){
							var value = this.get(i,j);
							if(value){
								var code = [0,0,0,0];
								if(this.get(i+1,j)&&!(this.get(i+1,j-1)&&this.get(i+1,j+1)&&this.get(i,j-1)&&this.get(i,j+1))){
									code[0]=1;
								}
								if(this.get(i,j+1)&&!(this.get(i-1,j+1)&&this.get(i+1,j+1)&&this.get(i-1,j)&&this.get(i+1,j))){
									code[1]=1;
								}
								if(this.get(i-1,j)&&!(this.get(i-1,j-1)&&this.get(i-1,j+1)&&this.get(i,j-1)&&this.get(i,j+1))){
									code[2]=1;
								}
								if(this.get(i,j-1)&&!(this.get(i-1,j-1)&&this.get(i+1,j-1)&&this.get(i-1,j)&&this.get(i+1,j))){
									code[3]=1;
								}
								if(code.indexOf(1)>-1){
									context.strokeStyle=value==2?"#FFF":config['wall_color'];
									var pos = this.coord2position(i,j);
									switch(code.join('')){
										case '1100':
											context.beginPath();
											context.arc(pos.x+this.size/2,pos.y+this.size/2,this.size/2,Math.PI,1.5*Math.PI,false);
											context.stroke();
											context.closePath();
											break;
										case '0110':
											context.beginPath();
											context.arc(pos.x-this.size/2,pos.y+this.size/2,this.size/2,1.5*Math.PI,2*Math.PI,false);
											context.stroke();
											context.closePath();
											break;
										case '0011':
											context.beginPath();
											context.arc(pos.x-this.size/2,pos.y-this.size/2,this.size/2,0,.5*Math.PI,false);
											context.stroke();
											context.closePath();
											break;
										case '1001':
											context.beginPath();
											context.arc(pos.x+this.size/2,pos.y-this.size/2,this.size/2,.5*Math.PI,1*Math.PI,false);
											context.stroke();
											context.closePath();
											break;
										default:
											var dist = this.size/2;
											code.forEach(function(v,index){
												if(v){
													context.beginPath();
													context.moveTo(pos.x,pos.y);
													context.lineTo(pos.x-_COS[index]*dist,pos.y-_SIN[index]*dist);
													context.stroke();
													context.closePath();
												}
											});
									}
								}
							}
						}
					}
				}
			});
			
			// Items map (beans/pellets)
			beans = stage.createMap({
				x:60,
				y:10,
				data:config['map'],
				size:18,
				frames:8,
				draw:function(context){
					for(var j=0; j<this.y_length; j++){
						for(var i=0; i<this.x_length; i++){
							if(!this.get(i,j)){
								var pos = this.coord2position(i,j);
								context.fillStyle = "#F5F5DC";
								if(config['goods'][i+','+j]){
									context.beginPath();
									context.arc(pos.x,pos.y,3+this.times%2,0,2*Math.PI,true);
									context.fill();
									context.closePath();
								}else{
									context.fillRect(pos.x-2,pos.y-2,4,4);
								}
							}
						}
					}
				}
			});
			
			// Score display
			stage.createItem({
				x:690,
				y:80,
				draw:function(context){
					context.font = '20px PressStart2P';
					context.textAlign = 'left';
					context.textBaseline = 'bottom';
					context.fillStyle = '#C33';
					context.fillText('SCORE',this.x,this.y);
					context.font = '20px PressStart2P';
					context.textAlign = 'left';
					context.textBaseline = 'top';
					context.fillStyle = '#FFF';
					context.fillText(_SCORE,this.x+12,this.y+10);
					context.font = '20px PressStart2P';
					context.textAlign = 'left';
					context.textBaseline = 'bottom';
					context.fillStyle = '#C33';
					context.fillText('LEVEL',this.x,this.y+72);
					context.font = '20px PressStart2P';
					context.textAlign = 'left';
					context.textBaseline = 'top';
					context.fillStyle = '#FFF';
					context.fillText(index+1,this.x+12,this.y+82);
				}
			});
			
			// Status text
			stage.createItem({
				x:690,
				y:285,
				frames:25,
			draw:function(context){
				if(stage.status==2&&this.times%2){
					context.font = '20px PressStart2P';
					context.textAlign = 'left';
					context.textBaseline = 'middle';
					context.fillStyle = '#FFF';
					context.fillText('PAUSE',this.x,this.y);
				}
			}
		});			// Lives display
			stage.createItem({
				x:705,
				y:510,
				width:30,
				height:30,
				draw:function(context){
					var max = Math.min(_LIFE-1,5);
					for(var i=0;i<max;i++){
						var x=this.x+40*i,y=this.y;
						context.fillStyle = '#FFE600';
						context.beginPath();
						context.arc(x,y,this.width/2,.15*Math.PI,-.15*Math.PI,false);
						context.lineTo(x,y);
						context.closePath();
						context.fill();
					}
				context.font = '16px PressStart2P';
				context.textAlign = 'left';
				context.textBaseline = 'middle';
				context.fillStyle = '#FFF';
				context.fillText('X',this.x-15,this.y+30);
				context.font = '20px PressStart2P';
				context.fillText((_LIFE-1),this.x+10,this.y+26);
			}
		});			// NPCs (ghosts)
			for(var i=0;i<4;i++){
				var npc = stage.createItem({
					width:30,
					height:30,
					orientation:3,
					color:_COLOR[i],
					location:map,
					coord:{x:12+i,y:14},
					vector:{x:12+i,y:14},
					type:2,
					frames:10,
					speed:1,
					timeout:Math.floor(Math.random()*120),
				update:function(){
					if(!window._npcUpdateLogged) {
						console.log('NPC update called! x=', this.x, 'y=', this.y, 'coord.x=', this.coord.x, 'coord.y=', this.coord.y, 'coord.offset=', this.coord.offset);
						window._npcUpdateLogged = true;
					}
					var new_map;
						if(this.status==3&&!this.timeout){
							this.status = 1;
						}
						var coord = this.coord;
						var isCentered = !coord.offset;
						if (coord.offset < this.speed) {
							var pos = map.coord2position(coord.x, coord.y);
							this.x = pos.x;
							this.y = pos.y;
							this.coord = map.position2coord(this.x, this.y);
							coord = this.coord;
							isCentered = true;
						}
						if(isCentered){			// Calculate at coord center
							if(this.status==1){
								if(!this.timeout){		// Timer
									new_map = JSON.parse(JSON.stringify(map.data).replace(/2/g,0));
									var id = this._id;
									items.forEach(function(item){
										if(item._id!=id&&item.status==1){	// Other NPCs as walls
											new_map[item.coord.y][item.coord.x]=1;
										}
									});
									this.path = map.finder({
										map:new_map,
										start:this.coord,
										end:player.coord
									});
									if(this.path.length){
										this.vector = this.path[0];
									}
								}
							}else if(this.status==3){
								new_map = JSON.parse(JSON.stringify(map.data).replace(/2/g,0));
								var id = this._id;
								items.forEach(function(item){
									if(item._id!=id){
										new_map[item.coord.y][item.coord.x]=1;
									}
								});
								this.path = map.finder({
									map:new_map,
									start:player.coord,
									end:this.coord,
									type:'next'
								});
								if(this.path.length){
									this.vector = this.path[Math.floor(Math.random()*this.path.length)];
								}
							}else if(this.status==4){
								new_map = JSON.parse(JSON.stringify(map.data).replace(/2/g,0));
								this.path = map.finder({
									map:new_map,
									start:this.coord,
									end:this._params.coord
								});
								if(this.path.length){
									this.vector = this.path[0];
								}else{
									this.status = 1;
								}
							}
							// Change direction
							if(this.vector.change){
								this.coord.x = this.vector.x;
								this.coord.y = this.vector.y;
								var pos = map.coord2position(this.coord.x,this.coord.y);
								this.x = pos.x;
								this.y = pos.y;
							}
							// Determine orientation
							if(this.vector.x>this.coord.x){
								this.orientation = 0;
							}else if(this.vector.x<this.coord.x){
								this.orientation = 2;
							}else if(this.vector.y>this.coord.y){
								this.orientation = 1;
							}else if(this.vector.y<this.coord.y){
								this.orientation = 3;
							}
						}
						this.x += this.speed*_COS[this.orientation];
						this.y += this.speed*_SIN[this.orientation];
					},
				draw:function(context){
					var isSick = false;
					if(this.status==3){
						isSick = this.timeout>80||this.times%2?true:false;
					}
					if(this.status!=4){
						context.fillStyle = isSick?'#BABABA':this.color;
						context.beginPath();
						context.arc(this.x,this.y,this.width*.5,0,Math.PI,true);
							switch(this.times%2){
								case 0:
								context.lineTo(this.x-this.width*.5,this.y+this.height*.4);
								context.quadraticCurveTo(this.x-this.width*.4,this.y+this.height*.5,this.x-this.width*.2,this.y+this.height*.3);
								context.quadraticCurveTo(this.x,this.y+this.height*.5,this.x+this.width*.2,this.y+this.height*.3);
								context.quadraticCurveTo(this.x+this.width*.4,this.y+this.height*.5,this.x+this.width*.5,this.y+this.height*.4);
								break;
								case 1:
								context.lineTo(this.x-this.width*.5,this.y+this.height*.3);
								context.quadraticCurveTo(this.x-this.width*.25,this.y+this.height*.5,this.x,this.y+this.height*.3);
								context.quadraticCurveTo(this.x+this.width*.25,this.y+this.height*.5,this.x+this.width*.5,this.y+this.height*.3);
								break;
							}
							context.fill();
							context.closePath();
						}
						context.fillStyle = '#FFF';
						if(isSick){
							context.beginPath();
							context.arc(this.x-this.width*.15,this.y-this.height*.21,this.width*.08,0,2*Math.PI,false);
							context.arc(this.x+this.width*.15,this.y-this.height*.21,this.width*.08,0,2*Math.PI,false);
							context.fill();
							context.closePath();
						}else{
							context.beginPath();
							context.arc(this.x-this.width*.15,this.y-this.height*.21,this.width*.12,0,2*Math.PI,false);
							context.arc(this.x+this.width*.15,this.y-this.height*.21,this.width*.12,0,2*Math.PI,false);
							context.fill();
							context.closePath();
							context.fillStyle = '#000';
							context.beginPath();
							context.arc(this.x-this.width*(.15-.04*_COS[this.orientation]),this.y-this.height*(.21-.04*_SIN[this.orientation]),this.width*.07,0,2*Math.PI,false);
							context.arc(this.x+this.width*(.15+.04*_COS[this.orientation]),this.y-this.height*(.21-.04*_SIN[this.orientation]),this.width*.07,0,2*Math.PI,false);
							context.fill();
							context.closePath();
						}
					}
			});
			// Initialize NPC position from grid coordinates
			var pos = map.coord2position(npc.coord.x, npc.coord.y);
			npc.x = pos.x;
			npc.y = pos.y;
		}
		items = stage.getItemsByType(2);
		
		var playerStartY = 23;
		var preferredRows = [21, 23, 25, 27, 19, 11, 5];
		for (var rIndex = 0; rIndex < preferredRows.length; rIndex++) {
			var pr = preferredRows[rIndex];
			if (config['map'][pr] && config['map'][pr][13] === 0 && config['map'][pr][14] === 0) {
				playerStartY = pr;
				break;
			}
		}
		if (playerStartY === 23) {
			for (var r = 0; r < config['map'].length; r++) {
				if (config['map'][r][13] === 0 && config['map'][r][14] === 0) {
					playerStartY = r;
					break;
				}
			}
		}

		// Player
		player = stage.createItem({
				width:30,
				height:30,
				type:1,
				location:map,
				coord:{x:13.5,y:playerStartY},
				vector:{x:13.5,y:playerStartY},
				orientation:2,
				speed:2,
				frames:10,
				update:function(){
					var coord = this.coord;
					var isCentered = !coord.offset;
					if (coord.offset < this.speed) {
						var pos = map.coord2position(coord.x, coord.y);
						this.x = pos.x;
						this.y = pos.y;
						this.coord = map.position2coord(this.x, this.y);
						coord = this.coord;
						isCentered = true;
					}
					if(isCentered){
						if(typeof this.control.orientation != 'undefined'){
							if(!map.get(coord.x+_COS[this.control.orientation],coord.y+_SIN[this.control.orientation])){
								this.orientation = this.control.orientation;
							}
						}
						this.control = {};
						var value = map.get(coord.x+_COS[this.orientation],coord.y+_SIN[this.orientation]);
						if(value==0){
							this.x += this.speed*_COS[this.orientation];
							this.y += this.speed*_SIN[this.orientation];
						}else if(value<0){
							this.x -= map.size*(map.x_length-1)*_COS[this.orientation];
							this.y -= map.size*(map.y_length-1)*_SIN[this.orientation];
						}
					}else{
						if(!beans.get(this.coord.x,this.coord.y)){	// Eat bean
							_SCORE++;
							beans.set(this.coord.x,this.coord.y,1);
							if(config['goods'][this.coord.x+','+this.coord.y]){	// Power pellet
								items.forEach(function(item){
									if(item.status==1||item.status==3){	// Normal NPCs become vulnerable
										item.timeout = 450;
										item.status = 3;
									}
								});
							}
						}
						this.x += this.speed*_COS[this.orientation];
						this.y += this.speed*_SIN[this.orientation];
					}
				},
				draw:function(context){
					context.fillStyle = '#FFE600';
					context.beginPath();
					if(stage.status!=3){	// Normal state
						if(this.times%2){
							context.arc(this.x,this.y,this.width/2,(.5*this.orientation+.20)*Math.PI,(.5*this.orientation-.20)*Math.PI,false);
						}else{
							context.arc(this.x,this.y,this.width/2,(.5*this.orientation+.01)*Math.PI,(.5*this.orientation-.01)*Math.PI,false);
						}
					}else{	// Death animation
						if(stage.timeout) {
							context.arc(this.x,this.y,this.width/2,(.5*this.orientation+1-.02*stage.timeout)*Math.PI,(.5*this.orientation-1+.02*stage.timeout)*Math.PI,false);
						}
					}
					context.lineTo(this.x,this.y);
					context.closePath();
					context.fill();
				}
		});
		// Initialize player position from grid coordinates
		var playerPos = map.coord2position(player.coord.x, player.coord.y);
		player.x = playerPos.x;
		player.y = playerPos.y;			// Event bindings
			stage.bind('keydown',function(e){
				switch(e.keyCode){
					case 32: // Space
					this.status = this.status==2?1:2;
					break;
					case 39: // Right
					player.control = {orientation:0};
					break;
					case 40: // Down
					player.control = {orientation:1};
					break;
					case 37: // Left
					player.control = {orientation:2};
					break;
					case 38: // Up
					player.control = {orientation:3};
					break;
				}
			});
		});
	})();
	
	// End screen
	(function(){
		var stage = game.createStage();
		// Game over text
		stage.createItem({
			x:game.width/2,
			y:game.height*.35,
			draw:function(context){
				context.fillStyle = '#FFF';
				context.font = '48px PressStart2P';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillText(_LIFE?'YOU WIN!':'GAME OVER',this.x,this.y);
			}
		});
		// Score
		stage.createItem({
			x:game.width/2,
			y:game.height*.5,
			draw:function(context){
				context.fillStyle = '#FFF';
				context.font = '20px PressStart2P';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillText('FINAL SCORE: '+(_SCORE+50*Math.max(_LIFE-1,0)),this.x,this.y);
			}
		});
		//copyright
		stage.createItem({
			x:game.width-10,
			y:game.height-5,
			draw:function(context){
				var text = 'Pac-Man Classic';
				context.font = '12px PressStart2P';
				context.textAlign = 'right';
				context.textBaseline = 'top';
				context.fillStyle = '#AAA';
				this.x = game.width-10;
				this.y = game.height-20-5;
				context.fillText(text,this.x,this.y);
			}
		});
		// Event bindings
		stage.bind('keydown',function(e){
			switch(e.keyCode){
				case 13: // Enter
				_SCORE = 0;
				_LIFE = 5;
				game.setStage(1);
				break;
			}
		});
	})();

	// Load custom font and initialize game
	(function() {
		var font = new FontFace('PressStart2P', 'url(../../assets/shared-graphics/PressStart2P.ttf)');
		font.load().then(function(loadedFont) {
			document.fonts.add(loadedFont);
			game.init();
		}).catch(function(error) {
			game.init();
		});
	})();
})();
