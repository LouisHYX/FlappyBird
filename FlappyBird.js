"use strict";

/*
* FlappyBird游戏
* 关键词：原生JS，引擎，精灵，canvas
* */
let FlappyBird = {

	/*
	* DOM节点
	* 标识哪些需要贴图
	* */
	NODE: {

		/*画布*/
		canvas: {node: document.getElementById('canvas'), render: false},// canvas标签

		/*loading页*/
		loadingBg: {node: document.getElementById('loadingBg'), render: false}, // 背景
		birdFly: {node: document.getElementById('birdFly'), render: false}, // 小鸟飞翔gif图
		loadingText: {node: document.getElementById('loadingText'), render: false}, // 加载进度
		progressBarBox: {node: document.getElementById('progressBarBox'), render: false}, // 进度条
		progressBar: {node: document.getElementById('progressBar'), render: false}, // 进度条当前进度

		/*主菜单*/
		mainMenuBg: {node: document.getElementById('mainMenuBg'), location: [0, 0], render: true}, // 大背景
		mainMenuBox: {node: document.getElementById('mainMenuBox'), location: [0, -482], render: true}, // 主菜单背景
		levelLabel: {node: document.getElementById('levelLabel'), location: [0, -450], render: true}, // 难度标题
		easyLevel: {node: document.getElementById('easyLevel'), location: [0, -260], render: true}, // 简单难度按钮
		normalLevel: {node: document.getElementById('normalLevel'), location: [0, -306], render: true}, // 中等难度按钮
		hardLevel: {node: document.getElementById('hardLevel'), location: [0, -352], render: true}, // 困难难度按钮
		cuttingLine: {node: document.getElementById('cuttingLine'), location: [0, -480], render: true}, // 分割线
		startGame: {node: document.getElementById('startGame'), location: [0, 0], render: true}, // 开始游戏按钮

		/*游戏界面*/
		scoreBoard: {node: document.getElementById('scoreBoard'), render: false}, // 得分面板外框
		scores: {node: document.getElementById('scores'), render: false}, // 得分显示框

		/*结束菜单*/
		deathMenuBox: {node: document.getElementById('deathMenuBox'), location: [0, -482], render: true}, // 结束菜单背景
		scoresLabel: {node: document.getElementById('scoresLabel'), location: [0, -465], render: true}, // 得分标题
		restartGame: {node: document.getElementById('restartGame'), location: [0, -104], render: true}, // 重玩按钮
		goMainMenu: {node: document.getElementById('goMainMenu'), location: [0, -52], render: true}, // 跳转主菜单按钮
		exitGame: {node: document.getElementById('exitGame'), location: [0, -156], render: true}, // 退出游戏按钮

		/*设置*/
		setting: {node: document.getElementById('setting'), location: [0, -398], render: true}, // 设置按钮
		settingMenuBox: {node: document.getElementById('settingMenuBox'), location: [0, -818], render: true}, // 设置菜单背景
		cuttingLineInSetting: {node: document.getElementById('cuttingLineInSetting'), location: [0, -480], render: true}, // 分割线
		musicSwitch: {node: document.getElementById('musicSwitch'), location: [-260, -482], render: true}, // 继续游戏按钮
		soundSwitch: {node: document.getElementById('soundSwitch'), location: [-404, -482], render: true}, // 继续游戏按钮
		getBack: {node: document.getElementById('getBack'), location: [-288, 0], render: true}, // 继续游戏按钮
		exitGameInSetting: {node: document.getElementById('exitGameInSetting'), location: [-288, -52], render: true}, // 退出游戏按钮
	},

	/*
	* 常量
	* */
	CONSTANT: (function(){
		// console.log(this);
	})(),

	/*
	* 游戏资源
	* 包括：图片，声音
	* */
	ASSET: {
		imageUrls: ['images/maps.png', 'images/sprite_sheet.png', 'images/bg.png'],
		audioUrls: [],
	},

	/*
	* 精灵行为
	* parameters对象存放行为所需的数值，循环执行动作时跳过该项
	* */
	BEHAVIOR: {

		/*小鸟行为集合*/
		birdBehavior: {
			parameters: {
				SCREEN_HEIGHT_IN_METERS: 100, // 设屏幕高度为100米
				PIXELS_PER_METER: window.screen.height / 100, // 设置1米等于多少像素
				G: 9.8, // 重力加速度(米 / 二次方秒)
				G_IN_GAME: 9.8 * window.screen.height / 100, // 游戏中重力加速度(像素 / 二次方秒)
				lastLocation: 0,
			},
			flapWings: function(bird, gameLevel, time){ // 小鸟扇动翅膀
				if(!bird.death){
					if(time - this.parameters.lastLocation > 100){
						if (bird.locationIndex < bird.location.length - 1) {
							bird.locationIndex++;
						} else {
							bird.locationIndex = 0;
						}

						this.parameters.lastLocation = time;
					}
				}
			},
			fallingBody: function(bird, gameLevel, time){ // 小鸟落体运动
				if(!bird.death){
					bird.top = bird.topOrigin + bird.velocityY * bird.t + this.parameters.G_IN_GAME * Math.pow(bird.t, 2) / 2;// 根据自由落体公式统一单位后计算小鸟的位置
					bird.t += 0.1;
				}
			},
		},

		/*水管行为集合*/
		pipesBehavior: {
			moveToLeft: function(pipes, gameLevel, time){ // 向左移动

				/*根据不同游戏难度设置不同的水管移动速度*/
				switch (gameLevel) {
					case 'easy': pipes.left -= 2; break;
					case 'normal': pipes.left -= 3; break;
					case 'hard': pipes.left -= 4; break;
				}
			},
		},

		/*背景行为集合*/
		gameBgBehavior: {
			moveToLeft: function(gameBg, gameLevel, time){ // 向左移动

				/*根据不同游戏难度设置不同的背景移动速度*/
				switch (gameLevel) {
					case 'easy': gameBg.left -= 0.2; break;
					case 'normal': gameBg.left -= 0.5; break;
					case 'hard': gameBg.left -= 0.8; break;
				}

				/*在屏幕上循环播放背景*/
				if(gameBg.left <= -FlappyBird.NODE.canvas.node.width){
					gameBg.left = 0;
				}
			},
		},
	},

	/*
	* 精灵绘制笔刷
	* 包括：单张图片绘制，精灵表绘制
	* */
	BRUSH: {

		/*小鸟笔刷*/
		birdBrush: function(bird, spriteSheet, ctx){
			ctx.drawImage(spriteSheet, bird.location[bird.locationIndex].x, bird.location[bird.locationIndex].y, bird.location[bird.locationIndex].w, bird.location[bird.locationIndex].h, bird.left, bird.top, bird.width, bird.height);
		},

		/*水管笔刷*/
		pipesBrush: function(pipe, spriteSheet, ctx){
			ctx.drawImage(spriteSheet, pipe.location['downward'].x, pipe.location['downward'].y, pipe.location['downward'].w, pipe.location['downward'].h, pipe.left, pipe.topDownward, pipe.width, pipe.height);
			ctx.drawImage(spriteSheet, pipe.location['upward'].x, pipe.location['upward'].y, pipe.location['upward'].w, pipe.location['upward'].h, pipe.left, pipe.topUpward, pipe.width, pipe.height);
		},

		/*背景笔刷*/
		gameBgBrush: function(gameBg, spriteSheet, ctx){
			ctx.drawImage(spriteSheet, gameBg.location.x, gameBg.location.y, gameBg.location.w, gameBg.location.h, gameBg.left, gameBg.top, gameBg.width, gameBg.height);
		},
	},

	/*
	* 精灵
	* 只关注自身属性，具体绘制与行为从中分离
	* 所有精灵贴图均存放于sprite_sheet.png
	* */
	SPRITE: function(spriteSheet, brush, behaviors){
		let Sprite = function(){
			this.brush = brush || {};
			this.behaviors = behaviors || {};
			this.spriteSheet = spriteSheet || {};

			this.width = 0;
			this.height = 0;
			this.left = 0;
			this.top = 0;
			this.velocityX = 0; // 水平速度
			this.velocityY = 0; // 垂直速度
			this.death = false; // 是否死亡
			this.location = {}; // 贴图位置
		};

		Sprite.prototype = {
			constructor: Sprite,

			/*绘制*/
			draw: function(ctx){
				if(!this.death) this.brush(this, this.spriteSheet, ctx);
			},

			/*更新*/
			update: function(gameLevel, time){
				for(let i in this.behaviors){
					if(i !== 'parameters' && this.behaviors.hasOwnProperty(i)) this.behaviors[i](this, gameLevel, time);
				}
			},
		};

		return new Sprite(spriteSheet, brush, behaviors);
	},

	/*
	* 引擎
	* */
	ENGINE: function(){
		let Engine = function(){

			/*获取需要操作的节点*/
			this.canvas = FlappyBird.NODE.canvas.node;
			this.loadingBg = FlappyBird.NODE.loadingBg.node;
			this.birdFly = FlappyBird.NODE.birdFly.node;
			this.mainMenuBg = FlappyBird.NODE.mainMenuBg.node;
			this.mainMenuBox = FlappyBird.NODE.mainMenuBox.node;
			this.loadingText = FlappyBird.NODE.loadingText.node;
			this.progressBarBox = FlappyBird.NODE.progressBarBox.node;
			this.progressBar = FlappyBird.NODE.progressBar.node;
			this.easyLevel = FlappyBird.NODE.easyLevel.node;
			this.normalLevel = FlappyBird.NODE.normalLevel.node;
			this.hardLevel = FlappyBird.NODE.hardLevel.node;
			this.startGame = FlappyBird.NODE.startGame.node;
			this.scoreBoard = FlappyBird.NODE.scoreBoard.node;
			this.scores = FlappyBird.NODE.scores.node;
			this.deathMenuBox = FlappyBird.NODE.deathMenuBox.node;
			this.restartGame = FlappyBird.NODE.restartGame.node;
			this.goMainMenu = FlappyBird.NODE.goMainMenu.node;
			this.exitGame = FlappyBird.NODE.exitGame.node;
			this.setting = FlappyBird.NODE.setting.node;
			this.settingMenuBox = FlappyBird.NODE.settingMenuBox.node;
			this.musicSwitch = FlappyBird.NODE.musicSwitch.node;
			this.soundSwitch = FlappyBird.NODE.soundSwitch.node;
			this.getBack = FlappyBird.NODE.getBack.node;
			this.exitGameInSetting = FlappyBird.NODE.exitGameInSetting.node;

			/*通用*/
			this.canvas.setAttribute('width', window.screen.width/* * window.devicePixelRatio */ + 'px');
			this.canvas.setAttribute('height', window.screen.height/* * window.devicePixelRatio*/  + 'px');
			this.context = this.canvas.getContext('2d'); // 绘图环境
			this.gameLevel = 'normal'; // 默认游戏难度
			this.paused = true; // 游戏暂停
			this.gameOver = true; // 游戏结束
			this.score = 10; // 单次得分
			this.finalScore = 0; // 得分
			this.listeners = [ // 存放所有监听器及对应的事件处理方法

				/*画布*/
				{
					listener: this.canvas,
					handler: function (e, me) {
						e.preventDefault();
						e.stopPropagation();

						/*给小鸟一个向上的初速度*/
						if( !me.paused ){ // 如果游戏没有停止，则可以点击
							me.bird.t = 0;
							me.bird.topOrigin = me.bird.top;
							if( me.bird.top > 0 ){ // 如果飞太高，则不能让他过多的超出上边界
								me.bird.velocityY = me.velocityYUpward;
							} else {
								me.bird.velocityY = 0;
							}
						}
					}
				},

				/*主菜单*/
				{
					listener: this.mainMenuBox,
					handler: function (e, me) {
						e.preventDefault();
						e.stopPropagation();

						switch (e.target.id) {
							case me.easyLevel.id:
							case me.normalLevel.id:
							case me.hardLevel.id:
								me.setGameLevel(e.target, me);
								break;
							case me.startGame.id:
								me.resetData(me);
								me.closeMenu(me.setting, me); // 隐藏设置按钮
								me.closeMenu(me.mainMenuBg, me); // 关闭主菜单
								me.showMenu(me.scoreBoard, me); // 显示计分板
								requestNextAnimationFrame(function(time){ // 开启循环
									me.animate.call(me, time);
								});
								break;
						}
					}
				},

				/*结束菜单*/
				{
					listener: this.deathMenuBox,
					handler: function(e, me){
						e.preventDefault();
						e.stopPropagation();

						switch (e.target.id) {
							case me.restartGame.id:
								me.resetData(me);
								me.closeMenu(me.deathMenuBox, me); // 关闭结束菜单
								requestNextAnimationFrame(function(time){ // 开启循环
									me.animate.call(me, time);
								});
								break;
							case me.goMainMenu.id:
								me.closeMenu(me.scoreBoard, me); // 关闭计分板
								me.closeMenu(me.deathMenuBox, me); // 关闭结束菜单
								me.showMenu(me.setting, me); // 显示设置按钮
								me.showMenu(me.mainMenuBg, me); // 显示主菜单
								break;
							case me.exitGame.id:
								window.opener = null;
								window.open('', '_self');
								window.close();
								break;
						}
					}
				},

				/*设置按钮*/
				{
					listener: this.setting,
					handler: function(e, me){
						e.preventDefault();
						e.stopPropagation();

						me.closeMenu(me.mainMenuBox, me); // 关闭主菜单，背景保留
						me.showMenu(me.settingMenuBox, me); // 开启设置菜单
					}
				},

				/*设置菜单*/{
					listener: this.settingMenuBox,
					handler: function(e, me){
						e.preventDefault();
						e.stopPropagation();

						switch (e.target.id) {
							case me.getBack.id:
								me.closeMenu(me.settingMenuBox, me); // 关闭设置菜单
								me.showMenu(me.mainMenuBox, me); // 显示主菜单
								break;
							case me.exitGameInSetting.id:
								window.opener = null;
								window.open('', '_self');
								window.close();
								break;
						}
					}
				}
			];

			/*精灵*/
			this.sprites = []; // 存放所有精灵
			this.bird = {}; // 存放小鸟
			this.gameBg = {}; // 存放背景
			this.velocityYUpward = -80; // 玩家单次点击给出的向上初速度
			this.lastPipesCreated = 0; // 上一组水管被创建的时间点
			this.createPipesInterval = 2000; // 创建水管组的时间间隔
			this.firstPipesIndex = 2; // 最左边一组水管在this.sprites中的索引

			/*图片*/
			this.images = {}; // 存放每个图片的名称及其对应的路径
			this.imageUrls = []; // 存放所有图片路径
			this.imageIndex = 0; // 图片路径数组的索引
			this.imagesLoaded = 0;  // 加载成功的图片数量
			this.imagesFailed = 0; // 加载失败的图片数量

			/*时间*/
			this.fps = 60;
			this.startTime = 0;
			this.lastTime = 0;
			this.gameTime = 0;

			this.bindTouchEvent(this.listeners); // 开启手指点击事件
		};

		Engine.prototype = {
			constructor: Engine,

			/*
			* 游戏初始化
			* 显示loading页，资源加载动画
			* 加载完毕后隐藏loading页，显示主菜单
			* 创建游戏中所有精灵
			* */
			init: function(){
				let me = this;

				/*图片加载*/
				this.birdFly.src = 'images/bird_fly.gif';
				this.birdFly.onload = function(){
					me.imagesLoader(FlappyBird.ASSET.imageUrls); // 加载游戏图片资源
					me.loadingBg.style.display = 'block'; // 显示loading页
				};
			},

			/*
			* 游戏循环
			* */
			start: function(){

				/*创建所有精灵*/
				this.createOtherSprites();

				this.showMenu(this.mainMenuBg, this); // 显示主菜单

				this.setGameLevel(); // 设置游戏难度
			},
			animate: function(time){
				let me = this;

				this.clearCanvas(); // 清除画布内容

				this.collisionDetection(); // 碰撞检测

				if(time - this.lastPipesCreated > this.createPipesInterval){
					this.sprites.push(this.createPipes());
					this.lastPipesCreated = time;
				}

				if(!this.bird.death) this.updateSprites(time); // 更新精灵
				this.drawSprites(); // 绘制精灵

				/*
				* 游戏循环是否继续
				* 如果游戏没有暂停且没有结束，则继续
				* */
				if(!this.paused && !this.gameOver){
					requestNextAnimationFrame(function(time){
						me.animate.call(me, time);
					});
				}
			},
			clearCanvas: function(){
				this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
			},
			updateSprites: function(time){
				for(let i = 0; i < this.sprites.length; i++){
					if(this.sprites[i]) this.sprites[i].update(this.gameLevel, time);
				}
			},
			drawSprites: function(){
				for(let i = 0; i < this.sprites.length; i++){
					if(this.sprites[i]) this.sprites[i].draw(this.context);
				}
			},

			/*
			* 创建除水管外的所有精灵
			* 注意：背景要最先绘制
			* */
			createOtherSprites: function(){
				this.sprites.push(this.createGameBg());
				this.sprites.push(this.createBird());
			},
			createGameBg: function(){
				let _gameBg = FlappyBird.SPRITE(this.images['images/sprite_sheet.png'], FlappyBird.BRUSH.gameBgBrush, FlappyBird.BEHAVIOR.gameBgBehavior);

				_gameBg.width = this.canvas.width * 2;
				_gameBg.height = this.canvas.height;
				_gameBg.location = {x: 0, y:0, w: 1080, h: 960};

				this.gameBg = _gameBg; // 单独存入，以便之后操作

				return _gameBg;
			},
			createBird: function(){
				let _bird = FlappyBird.SPRITE(this.images['images/sprite_sheet.png'], FlappyBird.BRUSH.birdBrush, FlappyBird.BEHAVIOR.birdBehavior);

				_bird.width = 52;
				_bird.height = 52;
				_bird.left = 70;
				_bird.top = 100;
				_bird.topOrigin = 100;
				_bird.t = 0;
				_bird.location = [{x: 0, y: 960, w: 52, h: 52}, {x: 52, y: 960, w: 52, h: 52}, {x: 104, y: 960, w: 52, h: 52}, {x: 156, y: 960, w: 52, h: 52}, {x: 208, y: 960, w: 52, h: 52}, {x: 260, y: 960, w: 52, h: 52}];
				_bird.correctWidth = 12; // 碰撞修正宽度，用于更精确计算碰撞
				_bird.correctHeight = 10; // 碰撞修正高度，用于更精确计算碰撞

				this.bird = _bird; // 单独存入，以便之后操作

				return _bird;
			},
			createPipes: function(){
				let _pipes = FlappyBird.SPRITE(this.images['images/sprite_sheet.png'], FlappyBird.BRUSH.pipesBrush, FlappyBird.BEHAVIOR.pipesBehavior);

				_pipes.width = 76;
				_pipes.height = 530;
				_pipes.left = this.canvas.width * 3 / 2;

				_pipes.maxGap = 360; // 水管之间间距最大值
				_pipes.minGap = 140; // 水管之间间距最小值
				_pipes.gap = Math.floor(Math.random() * (_pipes.maxGap - _pipes.minGap) + _pipes.minGap); // 水管之间的间距
				_pipes.topDownward = Math.floor(Math.random() * (0 - (-_pipes.height)) + (-_pipes.height)); // 上水管top值不会大于0

				/*
				* 下水管top值等于gap高度加上上水管在屏幕可见的高度
				* 如果下水管与屏幕下边界产生间隙，则将下水管紧贴屏幕下边界
				* */
				if( _pipes.gap + _pipes.height + _pipes.topDownward + _pipes.height >= this.canvas.height ){
					_pipes.topUpward = _pipes.gap + _pipes.height + _pipes.topDownward;
				} else {
					_pipes.topUpward = this.canvas.height - _pipes.height;
				}

				_pipes.location = {
					'downward': {x: 1080, y:0, w: 76, h: 530},
					'upward': {x: 1156, y:0, w: 76, h: 530},
				};

				return _pipes;
			},

			/*
			* 碰撞检测
			* 小鸟碰到水管，小鸟飞太高，小鸟飞太低，水管移出左边界
			* */
			collisionDetection: function(){

				/*水管移出左边界*/
				if(this.sprites[this.firstPipesIndex] && this.sprites[this.firstPipesIndex].left + this.sprites[this.firstPipesIndex].width < 0){
					this.sprites.splice(this.firstPipesIndex, 1); // 如果水管已经移出左边界，则从allPipes中删除该组水管连同其index，不让数组长度无限制增加
				}

				/*
				* 小鸟碰到水管
				* 循环遍历this.sprites数组，索引从第一组水管开始
				* 如果撞到水管则游戏结束，显示菜单；顺利通过则游戏继续，玩家得分
				* */
				for(let i = this.firstPipesIndex; i < this.sprites.length; i++){
					if(this.sprites[i].left < this.bird.left + this.bird.width && this.sprites[i].left + this.sprites[i].width > this.bird.left + this.bird.correctWidth){ // 与水管在x坐标上的比较
						if(this.sprites[i].height + this.sprites[i].topDownward > this.bird.top + this.bird.correctHeight || this.sprites[i].height + this.sprites[i].topDownward + this.sprites[i].gap < this.bird.top + this.bird.height - this.bird.correctHeight){ // 与水管在y坐标上的比较
							this.deathAnimation() // 小鸟死亡
						}
					} else if(this.sprites[i].left + this.sprites[i].width === this.bird.left){ // 小鸟通过水管
						this.scoreHandler(); // 得分
					}
				}

				/*小鸟飞太低*/
				if(this.bird.top > this.canvas.height){
					this.deathAnimation() // 小鸟死亡
				}
			},

			/*
			* 显示菜单
			* 传入要操控的节点及this指针
			* 游戏暂停或者结束都会执行
			* */
			showMenu: function(menuNode, me){
				let self = me;

				menuNode.style.display = 'block';

				if(menuNode.id === 'mainMenuBg') self.mainMenuBgScroll(me);
			},

			/*
			* 关闭菜单
			* 传入要操控的节点及this指针
			* */
			closeMenu: function(menuNode, me){
				let self = me;

				menuNode.style.display = 'none';
			},

			/*
			* 主菜单大背景滚动
			* */
			mainMenuBgScroll: function(me){
				let self = me || this,
					mainMenuBgMoveStep = 0,
					bgScrollTimer = undefined;

				/*
				* 当游戏处于暂停状态且主菜单显示时，背景按每秒60帧的速度向左移动
				* 移动距离超过一屏，则回到起点重新开始
				* */
				bgScrollTimer = setInterval(function(){
					if(self.paused){
						self.mainMenuBg.style.backgroundPosition = mainMenuBgMoveStep-- + 'px 0px';
						if(Math.abs(mainMenuBgMoveStep) > self.canvas.width) mainMenuBgMoveStep = 0;
					} else {
						clearInterval(bgScrollTimer);
					}
				}, 1000 / 60);
			},

			/*
			* 得分
			* 满足得分条件时执行，在游戏界面上显示当前得分
			* */
			scoreHandler: function(){
				this.finalScore += this.score;
				this.scores.textContent = this.finalScore;
			},

			/*
			* 重置游戏数据
			* 每次开始游戏以及重新开始游戏都要执行该方法
			* */
			resetData: function(me){
				let self = me || this;

				/*
				* 通用
				* 游戏结束标志设为false，游戏暂停设为false
				* */
				self.gameOver = false;
				self.paused = false;
				self.bird.death = false;
				self.scores.textContent = '0';
				self.finalScore = 0;

				/*
				* 小鸟
				* 小鸟死亡标志设为false，小鸟恢复原有高度
				* */
				self.bird.death = false;
				self.bird.top = 100;
				self.bird.topOrigin = 100;
				self.bird.t = 0;
				self.bird.velocityY = 0;

				/*
				* 水管
				* 删除this.sprites数组中所有水管数据，水管x值重新设置到二分之三屏处
				* */
				self.sprites = self.sprites.slice(0, self.firstPipesIndex);

				/*
				* 背景
				* x坐标设置为0
				* */
				self.gameBg.left = 0;
			},

			/*
			* 小鸟死亡动画
			* 小鸟死亡时才会播放
			* 一定时间后执行游戏结束处理函数
			* */
			deathAnimation: function(){
				let me = this;

				me.gameOver = true;
				me.paused = true;
				me.bird.death = true;

				let deadBird = document.createElement('div');
				let deadBird_v = -140;
				let deadBird_t = 0;
				let deadBird_top = me.bird.top + 'px'; // 死亡小鸟原始top值
				let deadAnimationTimer = undefined;
				deadBird.style.width = '52px';
				deadBird.style.height = '52px';
				deadBird.style.background = 'url("images/sprite_sheet.png")';
				deadBird.style.backgroundPosition = '-312px -960px';
				deadBird.style.position = 'absolute';
				deadBird.style.top = me.bird.top + 'px';
				deadBird.style.left = me.bird.left + 'px';
				document.body.appendChild(deadBird);

				/*
				* 播放死亡动画
				* */
				setTimeout(function(){
					deadAnimationTimer = setInterval(function(){
						deadBird.style.top = parseInt(deadBird_top) + deadBird_v * deadBird_t + 72 * Math.pow(deadBird_t, 2) / 2 + 'px';// 根据自由落体公式统一单位后计算死亡小鸟的位置
						deadBird_v += 1;
						deadBird_t += 0.2;

						if( deadBird_t <= 2 ){
							deadBird.style.backgroundPosition = '-364px -960px';
						} else if( deadBird_t > 2 ) {
							deadBird.style.backgroundPosition = '-416px -960px';
						}

						if( deadBird.offsetTop > window.screen.height ){// 小鸟飞出屏幕后，间隔一定时间显示菜单
							document.body.removeChild(deadBird);// 删除死亡的小鸟
							clearInterval(deadAnimationTimer);// 清除该定时器
							setTimeout(function(){
								me.showMenu(me.deathMenuBox, me);
							} ,500);
						}
					}, 30);
				}, 500);
			},

			/*
			* 设置游戏难度
			* 默认为'normal'难度，如果玩家自己点击按钮更换难度，则切换该按钮的贴图
			* offsetWidth属性值必须在其父盒子没有设置display: none的情况下才能获取到
			* */
			setGameLevel: function(touchTarget, me){
				let	self = me || this,
					_touchTarget = touchTarget || undefined;

				/*
				* 修改难度显示
				* 先还原按钮南图贴图，再修改为需要显示的难度贴图并赋值给this.gameLevel
				* */
				self.easyLevel.style.backgroundPosition = '0 ' + FlappyBird.NODE.easyLevel.location[1] + 'px';
				self.normalLevel.style.backgroundPosition = '0 ' + FlappyBird.NODE.normalLevel.location[1] + 'px';
				self.hardLevel.style.backgroundPosition = '0 ' + FlappyBird.NODE.hardLevel.location[1] + 'px';
				if(_touchTarget && FlappyBird.NODE.hasOwnProperty(_touchTarget.id)){
					_touchTarget.style.backgroundPosition = -_touchTarget.offsetWidth + 'px ' + FlappyBird.NODE[_touchTarget.id].location[1] + 'px';
					self.gameLevel = _touchTarget.getAttribute('data-level');
					self.createPipesInterval = _touchTarget.getAttribute('data-createPipesInterval');
				} else {
					self.normalLevel.style.backgroundPosition = -this.normalLevel.offsetWidth + 'px ' + FlappyBird.NODE.normalLevel.location[1] + 'px';
					self.gameLevel = 'normal';
					self.createPipesInterval = 2000;
				}
			},

			/*
			* 贴图渲染
			* 传入节点对象
			* 将已加载完毕的贴图渲染到各个所需要的节点
			* */
			renderMaps: function(nodesSet){
				let _nodesSet = nodesSet || undefined;

				if(_nodesSet){
					for(let singleNode in _nodesSet){
						if(_nodesSet.hasOwnProperty(singleNode) && _nodesSet[singleNode].render){
							if(_nodesSet[singleNode].node.id !== this.mainMenuBg.id){
								_nodesSet[singleNode].node.style.backgroundImage = 'url("images/maps.png")';/*之后用this.images代替*/
							} else {
								_nodesSet[singleNode].node.style.backgroundImage = 'url("images/bg.png")';/*之后用this.images代替*/
							}
							_nodesSet[singleNode].node.style.backgroundPosition = _nodesSet[singleNode].location[0] + 'px ' + _nodesSet[singleNode].location[1] + 'px';
							_nodesSet[singleNode].node.style.backgroundRepeat = 'no-repeat';
						}
					}
				}
			},

			/*
			* 图片加载器
			* 循环执行图片的onload事件，每完成一张则将预加载图片数组索引值加1，直到全部完成
			* */
			imagesLoader: function(imageUrlsInAsset){
				let me = this,
					loadImagesTimer = undefined,
					loadingComplete = 0;

				/*获取资源中的所有图片路径*/
				for(let i = 0; i < imageUrlsInAsset.length; i++){
					this.imageUrls.push(imageUrlsInAsset[i]);
				}

				/*
				* 开始循环执行图片加载
				* 显示进度条及加载进度百分比
				* 如果加载进度到达100，则清除计时器，渲染游戏贴图，一段时间后关闭loading页，正式开始游戏
				* */
				loadImagesTimer = setInterval(function(){

					/*获得当前加载进度，最高100*/
					loadingComplete = me.loadImages();

					if(loadingComplete === 100){
						clearInterval(loadImagesTimer);
						me.renderMaps(FlappyBird.NODE);
						setTimeout(function(){
							me.loadingBg.style.display = 'none';
							me.start();
						}, 1500);
					}

					me.progressBar.style.width = (loadingComplete / 100) * me.progressBarBox.offsetWidth + 'px'; // 显示进度条当前进度
					me.loadingText.textContent = loadingComplete.toFixed(0) + '%'; // 显示当前进度百分比
				}, 50);
			},
			loadImages: function(){

				/*
				* 如果还有未加载的图片，则继续加载；如果没有图片需要加载，则直接返回100
				* */
				if (this.imageIndex < this.imageUrls.length) {
					this.loadImage(this.imageUrls[this.imageIndex]);
					this.imageIndex++;
				} else {
					return 100;
				}

				return (this.imagesLoaded + this.imagesFailed) / this.imageUrls.length * 100;
			},
			loadImage: function(imageUrl){
				let me = this,
					image = new Image();

				image.src = imageUrl;

				image.addEventListener('load', function(){
					me.imagesLoaded++;
				});

				image.addEventListener('error', function(){
					me.imagesFailed++;
				});

				/*存储图片对象及其路径*/
				this.images[imageUrl] = image;
			},

			/*
			* 时间
			* */
			updateFps: function(time){
				this.fps = 1000 / (time - this.lastTime);
			},

			/*
			* 手指点击事件
			* 向点击事件函数传递当前this指针
			* */
			bindTouchEvent: function(listeners){
				let me = this;

				for(let i = 0; i < this.listeners.length; i++){
					listeners[i].listener.addEventListener('click', function(e){
						me.listeners[i].handler(e, me);
					});
				}
			},
		};

		return new Engine();
	},
};

FlappyBird.ENGINE().init();



