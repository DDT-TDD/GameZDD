// Chef Rush Game
class ChefRushGame{constructor(){this.canvas=document.getElementById('gameCanvas');this.ctx=this.canvas.getContext('2d');this.audio=new AudioManager();this.input=new InputHandler();this.save=new SaveManager('chef-rush');this.score=0;this.level=1;this.burgers=0;this.gameState='menu';this.speedMultiplier=1.0;this.player={x:100,y:400,width:30,height:40,vx:0,vy:0,jumping:false,speed:3,onLadder:false};this.platforms=[];this.ladders=[];this.ingredients=[];this.enemies=[];this.gravity=0.5;this.levelConfigs=[{name:'Appetizer Rush',mission:'Collect 5 ingredients',targetIngredients:5,ingredientCount:5,enemyCount:1},{name:'Main Course',mission:'Collect 10 ingredients',targetIngredients:10,ingredientCount:10,enemyCount:2},{name:'Gourmet Challenge',mission:'Collect 15 ingredients',targetIngredients:15,ingredientCount:15,enemyCount:3},{name:'Michelin Pursuit',mission:'Collect 20 ingredients',targetIngredients:20,ingredientCount:20,enemyCount:3},{name:'Five-Star Recipe',mission:'Collect 25 ingredients',targetIngredients:25,ingredientCount:25,enemyCount:4},{name:'Culinary Chaos',mission:'Collect 30 ingredients',targetIngredients:30,ingredientCount:30,enemyCount:4}];this.currentLevel=0;this.levelIntroTime=0;this.comboTimer=0;this.combo=0;this.collectedCount=0;this.init()}init(){this.setupEventListeners();this.loadGame();this.drawMenu()}setupEventListeners(){document.getElementById('startBtn').addEventListener('click',()=>this.startGame());document.getElementById('backBtn').addEventListener('click',()=>this.backToMenu());document.getElementById('fullscreenBtn').addEventListener('click',()=>this.toggleFullscreen());const speedSlider=document.getElementById('speedSlider');const speedValue=document.getElementById('speedValue');speedSlider.addEventListener('input',(e)=>{const speed=parseFloat(e.target.value);speedValue.textContent=speed.toFixed(1)+'x';this.speedMultiplier=speed;this.player.speed=3*this.speedMultiplier});this.input.on('keydown',(e)=>{if(this.gameState!=='playing')return;switch(e.code){case'ArrowLeft':case'KeyA':this.player.vx=-this.player.speed;break;case'ArrowRight':case'KeyD':this.player.vx=this.player.speed;break;case'ArrowUp':case'KeyW':if(this.player.onLadder){this.player.vy=-3*this.speedMultiplier}break;case'ArrowDown':case'KeyS':if(this.player.onLadder){this.player.vy=3*this.speedMultiplier}break}});this.input.on('keyup',(e)=>{if(this.gameState!=='playing')return;switch(e.code){case'ArrowLeft':case'KeyA':case'ArrowRight':case'KeyD':this.player.vx=0;break;case'ArrowUp':case'KeyW':case'ArrowDown':case'KeyS':if(this.player.onLadder){this.player.vy=0}break}})}createLevel(){const config=this.levelConfigs[this.currentLevel]||this.levelConfigs[this.levelConfigs.length-1];this.platforms=[{x:0,y:460,width:640,height:20},{x:50,y:360,width:250,height:20},{x:350,y:360,width:250,height:20},{x:50,y:260,width:250,height:20},{x:350,y:260,width:250,height:20},{x:50,y:160,width:250,height:20},{x:350,y:160,width:250,height:20}];this.ladders=[{x:120,y:360,height:100},{x:420,y:360,height:100},{x:180,y:260,height:100},{x:480,y:260,height:100},{x:250,y:160,height:100}];this.ingredients=[];const ingredientTypes=['bun','patty','lettuce','cheese','tomato'];for(let i=0;i<config.ingredientCount;i++){this.ingredients.push({x:50+Math.random()*540,y:140+Math.random()*300,collected:false,type:ingredientTypes[i%ingredientTypes.length]})}this.enemies=[];for(let i=0;i<config.enemyCount;i++){this.enemies.push({x:150+i*150,y:340,vx:1.5+i*0.3,width:25,height:25})}this.player.x=100;this.player.y=400;this.player.vx=0;this.player.vy=0;this.player.jumping=false;this.player.onLadder=false;this.burgers=0;this.collectedCount=0;this.levelIntroTime=120;this.comboTimer=0}update(){const deltaTime=1/60;if(this.levelIntroTime>0)this.levelIntroTime-=deltaTime;if(this.comboTimer>0)this.comboTimer-=deltaTime;else this.combo=0;this.player.onLadder=false;for(let ladder of this.ladders){if(this.player.x+this.player.width>ladder.x&&this.player.x<ladder.x+20&&this.player.y+this.player.height>ladder.y-ladder.height&&this.player.y<ladder.y){this.player.onLadder=true;break}}if(!this.player.onLadder){this.player.vy+=this.gravity}else{if(this.player.vy===0){this.player.vy=0}}this.player.x+=this.player.vx;this.player.y+=this.player.vy;this.player.jumping=true;for(let platform of this.platforms){if(this.player.x+this.player.width>platform.x&&this.player.x<platform.x+platform.width&&this.player.y+this.player.height>platform.y&&this.player.y+this.player.height<platform.y+platform.height+10&&this.player.vy>0){this.player.y=platform.y-this.player.height;this.player.vy=0;this.player.jumping=false}}if(this.player.x<0)this.player.x=0;if(this.player.x+this.player.width>this.canvas.width){this.player.x=this.canvas.width-this.player.width}if(this.player.y>this.canvas.height){this.gameState='gameOver';this.audio.playSFX('die')}for(let ingredient of this.ingredients){if(!ingredient.collected){const dist=Math.hypot(this.player.x-ingredient.x,this.player.y-ingredient.y);if(dist<30){ingredient.collected=true;this.collectedCount++;this.burgers++;this.combo++;this.comboTimer=1.2;const baseScore=100;const multiplier=1+this.combo*0.15;this.score+=Math.floor(baseScore*multiplier);this.audio.playSFX('collect')}}}if(this.collectedCount>=this.levelConfigs[this.currentLevel].targetIngredients){this.currentLevel++;if(this.currentLevel>=this.levelConfigs.length){this.gameState='gameOver'}else{this.audio.playSFX('win');this.createLevel()}}for(let enemy of this.enemies){enemy.x+=enemy.vx*this.speedMultiplier;if(enemy.x<0||enemy.x+enemy.width>this.canvas.width){enemy.vx*=-1}if(this.player.x+this.player.width>enemy.x&&this.player.x<enemy.x+enemy.width&&this.player.y+this.player.height>enemy.y&&this.player.y<enemy.y+enemy.height){this.gameState='gameOver';this.audio.playSFX('die')}}document.getElementById('score').textContent=this.score;document.getElementById('level').textContent=this.level;document.getElementById('burgers').textContent=this.burgers}draw(){this.ctx.fillStyle='rgba(26,26,46,0.9)';this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);this.ctx.fillStyle='#FFB84D';for(let platform of this.platforms){this.ctx.fillRect(platform.x,platform.y,platform.width,platform.height)}this.ctx.fillStyle='#8B4513';for(let ladder of this.ladders){for(let i=0;i<ladder.height;i+=20){this.ctx.fillRect(ladder.x,ladder.y-i,20,15)}}const colors={bun:'#D2691E',patty:'#8B4513',lettuce:'#90EE90',cheese:'#FFD700',tomato:'#FF6347'};
for (let ingredient of this.ingredients) {
	if (!ingredient.collected) {
		const ix = ingredient.x;
		const iy = ingredient.y;
		const iw = 30;
		const ih = 15;
		this.ctx.fillStyle = colors[ingredient.type] || '#FFD700';
		if (ingredient.type === 'bun') {
			this.ctx.beginPath();
			this.ctx.moveTo(ix, iy + ih);
			this.ctx.bezierCurveTo(ix, iy, ix + iw, iy, ix + iw, iy + ih);
			this.ctx.closePath();
			this.ctx.fill();
			this.ctx.fillStyle = '#FFFFFF';
			this.ctx.fillRect(ix + 6, iy + ih - 10, 1.5, 1.5);
			this.ctx.fillRect(ix + 14, iy + ih - 12, 1.5, 1.5);
			this.ctx.fillRect(ix + 22, iy + ih - 8, 1.5, 1.5);
		} else if (ingredient.type === 'patty') {
			this.ctx.beginPath();
			this.ctx.roundRect(ix, iy, iw, ih, 4);
			this.ctx.fill();
			this.ctx.strokeStyle = '#3E2723';
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			for(let gx=ix+5; gx<ix+iw; gx+=6){
				this.ctx.moveTo(gx, iy);
				this.ctx.lineTo(gx - 2, iy + ih);
			}
			this.ctx.stroke();
		} else if (ingredient.type === 'lettuce') {
			this.ctx.beginPath();
			this.ctx.moveTo(ix, iy + ih/2);
			for (let lx = ix; lx <= ix + iw; lx += 4) {
				let ly = iy + ih/2 + Math.sin(lx * 1.5) * 3;
				this.ctx.lineTo(lx, ly);
			}
			this.ctx.lineTo(ix + iw, iy + ih);
			this.ctx.lineTo(ix, iy + ih);
			this.ctx.closePath();
			this.ctx.fill();
		} else if (ingredient.type === 'tomato') {
			this.ctx.fillStyle = '#D32F2F';
			this.ctx.beginPath();
			this.ctx.roundRect(ix, iy, iw, ih, 3);
			this.ctx.fill();
			this.ctx.fillStyle = '#FFCA28';
			this.ctx.fillRect(ix + 8, iy + ih/2, 2, 2);
			this.ctx.fillRect(ix + 20, iy + ih/2, 2, 2);
		} else {
			this.ctx.beginPath();
			this.ctx.moveTo(ix, iy);
			this.ctx.lineTo(ix + iw, iy);
			this.ctx.lineTo(ix + iw, iy + ih - 4);
			this.ctx.lineTo(ix + iw - 4, iy + ih);
			this.ctx.lineTo(ix + 4, iy + ih);
			this.ctx.lineTo(ix, iy + ih - 4);
			this.ctx.closePath();
			this.ctx.fill();
		}
	}
}
for (let i = 0; i < this.enemies.length; i++) {
	let enemy = this.enemies[i];
	const ex = enemy.x;
	const ey = enemy.y;
	const ew = enemy.width;
	const eh = enemy.height;
	if (i % 2 === 0) {
		this.ctx.fillStyle = '#D84315';
		this.ctx.beginPath();
		this.ctx.roundRect(ex + 4, ey, ew - 8, eh, 6);
		this.ctx.fill();
		this.ctx.strokeStyle = '#FFEB3B';
		this.ctx.lineWidth = 1.5;
		this.ctx.beginPath();
		this.ctx.moveTo(ex + ew/2, ey + 4);
		this.ctx.lineTo(ex + ew/2 - 2, ey + eh/2);
		this.ctx.lineTo(ex + ew/2 + 2, ey + eh - 4);
		this.ctx.stroke();
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(ex + 8, ey + 6, 2, 2);
		this.ctx.fillRect(ex + ew - 10, ey + 6, 2, 2);
		this.ctx.fillStyle = '#FFFFFF';
		this.ctx.fillRect(ex + 9, ey + 6, 1, 1);
		this.ctx.fillRect(ex + ew - 9, ey + 6, 1, 1);
	} else {
		this.ctx.fillStyle = '#FFFFFF';
		this.ctx.beginPath();
		this.ctx.arc(ex + ew/2, ey + eh/2, eh/2, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.fillStyle = '#FFCA28';
		this.ctx.beginPath();
		this.ctx.arc(ex + ew/2 - 2, ey + eh/2 - 2, 5, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(ex + ew/2 - 5, ey + eh/2 - 4, 1.5, 1.5);
		this.ctx.fillRect(ex + ew/2 + 1, ey + eh/2 - 4, 1.5, 1.5);
	}
	this.ctx.fillStyle = '#C62828';
	this.ctx.fillRect(ex + 2, ey + eh - 2, 6, 3);
	this.ctx.fillRect(ex + ew - 8, ey + eh - 2, 6, 3);
}
const px = this.player.x;
const py = this.player.y;
const pw = this.player.width;
const ph = this.player.height;
this.ctx.fillStyle = '#FFFFFF';
this.ctx.fillRect(px + 4, py + 16, pw - 8, 16);
this.ctx.fillStyle = '#D32F2F';
this.ctx.fillRect(px + 10, py + 14, pw - 20, 3);
this.ctx.fillStyle = '#FFCCBC';
this.ctx.fillRect(px + 6, py + 6, pw - 12, 9);
this.ctx.fillStyle = '#0288D1';
this.ctx.fillRect(px + 10, py + 8, 2, 2);
this.ctx.fillRect(px + 18, py + 8, 2, 2);
this.ctx.fillStyle = '#FFFFFF';
this.ctx.beginPath();
this.ctx.arc(px + pw/2 - 4, py + 2, 6, 0, Math.PI * 2);
this.ctx.arc(px + pw/2 + 4, py + 2, 6, 0, Math.PI * 2);
this.ctx.arc(px + pw/2, py - 2, 6, 0, Math.PI * 2);
this.ctx.fill();
this.ctx.fillRect(px + 8, py + 3, pw - 16, 4);
this.ctx.fillStyle = '#1A237E';
this.ctx.fillRect(px + 4, py + 32, pw - 8, 8);
this.ctx.fillStyle = '#5D4037';
this.ctx.fillRect(px + pw/2 - 10, py + ph - 2, 7, 3);
this.ctx.fillRect(px + pw/2 + 3, py + ph - 2, 7, 3);
this.drawMissionHUD()}drawMissionHUD(){const config=this.levelConfigs[this.currentLevel];if(!config)return;if(this.levelIntroTime>0){this.ctx.fillStyle='rgba(0,0,0,0.6)';this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);this.ctx.fillStyle='#FFB84D';this.ctx.font='bold 32px Arial';this.ctx.textAlign='center';this.ctx.fillText('👨‍🍳 '+config.name,this.canvas.width/2,this.canvas.height/2-30);this.ctx.font='20px Arial';this.ctx.fillStyle='#FFD700';this.ctx.fillText(config.mission,this.canvas.width/2,this.canvas.height/2+20)}this.ctx.fillStyle='rgba(255,184,77,0.8)';this.ctx.fillRect(10,10,360,60);this.ctx.fillStyle='white';this.ctx.font='bold 16px Arial';this.ctx.textAlign='left';this.ctx.fillText('👨‍🍳 '+config.name,20,30);this.ctx.fillText('Collected: '+this.collectedCount+'/'+config.targetIngredients,20,50);this.ctx.fillStyle=this.combo>0?'#FFD700':'white';this.ctx.font='bold 20px Arial';this.ctx.fillText('Combo: '+this.combo+'x',this.canvas.width-150,30)}startGame(){this.gameState='playing';this.createLevel();this.lastTime=performance.now();this.gameLoop(this.lastTime)}gameLoop(currentTime){if(this.gameState!=='playing'&&this.gameState!=='gameOver')return;if(this.gameState==='playing'){this.update()}this.draw();if(this.gameState==='gameOver'){this.ctx.fillStyle='rgba(0,0,0,0.7)';this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);this.ctx.fillStyle='#FFB84D';this.ctx.font='bold 48px Arial';this.ctx.textAlign='center';this.ctx.fillText('Game Over!',this.canvas.width/2,this.canvas.height/2);this.ctx.fillStyle='white';this.ctx.font='24px Arial';this.ctx.fillText('Final Score: '+this.score,this.canvas.width/2,this.canvas.height/2+50);return}requestAnimationFrame((time)=>this.gameLoop(time))}toggleFullscreen(){const container=document.querySelector('.game-container');if(!document.fullscreenElement){container.requestFullscreen().catch(err=>{console.log('Fullscreen error:',err)});document.getElementById('fullscreenBtn').textContent='🖥️ Exit Fullscreen'}else{document.exitFullscreen();document.getElementById('fullscreenBtn').textContent='🖥️ Fullscreen'}}backToMenu(){this.gameState='menu';this.save.save({score:this.score,level:this.level});window.location.href='../../launcher.html'}loadGame(){const data=this.save.load();if(data){this.score=data.score||0;this.level=data.level||1}}drawMenu(){this.ctx.fillStyle='rgba(26,26,46,0.95)';this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);this.ctx.fillStyle='#FFB84D';this.ctx.font='bold 48px Arial';this.ctx.textAlign='center';this.ctx.fillText('👨‍� Chef Rush',this.canvas.width/2,100);this.ctx.fillStyle='white';this.ctx.font='24px Arial';this.ctx.fillText('Collect all burger ingredients!',this.canvas.width/2,300)}}window.addEventListener('load',()=>new ChefRushGame());
