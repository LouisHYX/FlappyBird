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
		mainMenuBg: {node: document.getElementById('mainMenuBg'), location: [0, 0], render: true}, // 背景
		mainMenuBox: {node: document.getElementById('mainMenuBox'), location: [0, -482], render: true}, // 主菜单背景
		levelLabel: {node: document.getElementById('levelLabel'), location: [0, -450], render: true}, // 难度标题
		easyLevel: {node: document.getElementById('easyLevel'), location: [0, -260], render: true}, // 简单难度按钮
		normalLevel: {node: document.getElementById('normalLevel'), location: [0, -306], render: true}, // 中等难度按钮
		hardLevel: {node: document.getElementById('hardLevel'), location: [0, -352], render: true}, // 困难难度按钮
		cutting_line: {node: document.getElementById('cutting_line'), location: [0, -480], render: true}, // 分割线
		startGame: {node: document.getElementById('startGame'), location: [0, 0], render: true}, // 开始游戏按钮
	},

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
	* */
	BEHAVIOR: {

		/*小鸟行为集合*/
		birdBehavior: {
			parameters: { // 循环执行动作时跳过该项
				lastLocation: 0,
			},
			flapWings: function(bird, gameLevel, time){ // 小鸟扇动翅膀
				if(time - this.parameters.lastLocation > 100){
					if (bird.locationIndex < bird.location.length - 1) {
						bird.locationIndex++;
					} else {
						bird.locationIndex = 0;
					}

					this.parameters.lastLocation = time;
				}
			},
			fallingBody: function(bird, gameLevel, time){ // 小鸟落体运动

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
					case 'normal': gameBg.left -= 0.3; break;
					case 'hard': gameBg.left -= 0.4; break;
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
			let location = bird.location[bird.locationIndex];
			ctx.drawImage(spriteSheet, location.x, location.y, location.w, location.h, bird.left, bird.top, bird.width, bird.height);
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
			this.location = undefined; // 贴图位置
		};

		Sprite.prototype = {
			constructor: Sprite,

			/*
			* 绘制
			* */
			draw: function(ctx){
				this.brush(this, this.spriteSheet, ctx);
			},

			/*
			* 更新
			* */
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

			/*通用*/
			this.canvas.setAttribute('width', window.screen.width/* * window.devicePixelRatio */ + 'px');
			this.canvas.setAttribute('height', window.screen.height/* * window.devicePixelRatio*/  + 'px');
			this.context = this.canvas.getContext('2d'); // 绘图环境
			this.gameLevel = 'normal'; // 默认游戏难度
			this.paused = false; // 游戏暂停
			this.gameOver = true; // 游戏结束
			this.listeners = [ // 存放所有监听器及对应的事件处理方法
				{
					listener: this.canvas,
					handler: function (e) {
						e.preventDefault();
						e.stopPropagation();

						// 给小鸟一个向上的初速度
					}
				},
				{
					listener: this.mainMenuBox,
					handler: function (e, me) {
						e.preventDefault();
						e.stopPropagation();

						switch (e.target.id) {
							case me.easyLevel.id:
							case me.normalLevel.id:
							case me.hardLevel.id:
								me.setGameLevel(me, e.target);
								break;
							case me.startGame.id:
								me.mainMenuBg.style.display = 'none'; // 关闭主菜单
								me.mainMenuShow = false;
								me.gameOver = false;
								requestNextAnimationFrame(function(time){ // 开启循环
									me.animate.call(me, time);
								});
								break;
						}
					}
				}
			];

			/*菜单*/
			this.mainMenuShow = false; // 主菜单是否显示

			/*精灵*/
			this.sprites = []; // 存放所有精灵
			this.lastPipesCreated = 0; // 上一组水管被创建的时间点
			this.createPipesInterval = 2000; // 创建水管组的时间间隔

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

				this.mainMenuBg.style.display = 'block'; // 显示主菜单
				this.mainMenuShow = true; // 显示标识设为true

				this.setGameLevel(); // 设置游戏难度

				this.mainMenuBgScroll(); // 主菜单大背景滚动

			},
			animate: function(time){
				let me = this;

				this.clearCanvas(); // 清除画布内容

				if(time - this.lastPipesCreated > this.createPipesInterval){
					this.sprites.push(this.createPipes());
					console.log([this.sprites, this.sprites.length, time]);
					this.lastPipesCreated = time;
				}

				this.updateSprites(time); // 更新精灵
				this.drawSprites(); // 绘制精灵

				this.collisionDetection(); // 碰撞检测

				if(!this.gameOver && !this.paused){
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

				return _gameBg;
			},
			createBird: function(){
				let _bird = FlappyBird.SPRITE(this.images['images/sprite_sheet.png'], FlappyBird.BRUSH.birdBrush, FlappyBird.BEHAVIOR.birdBehavior);

				_bird.width = 52;
				_bird.height = 52;
				_bird.left = 70;
				_bird.top = 100;
				_bird.location = [{x: 0, y: 960, w: 52, h: 52}, {x: 52, y: 960, w: 52, h: 52}, {x: 104, y: 960, w: 52, h: 52}, {x: 156, y: 960, w: 52, h: 52}, {x: 208, y: 960, w: 52, h: 52}, {x: 260, y: 960, w: 52, h: 52}];
				_bird.locationIndex = 0; // 贴图位置索引

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
			* 小鸟与水管，小鸟飞太高，小鸟飞太低
			* */
			collisionDetection: function(){

			},

			/*
			* 设置游戏难度
			* 默认为'normal'难度，如果玩家自己点击按钮更换难度，则切换该按钮的贴图
			* offsetWidth属性值必须在其父盒子没有设置display: none的情况下才能获取到
			* */
			setGameLevel: function(me, touchTarget){
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
			* 主菜单大背景滚动
			* */
			mainMenuBgScroll: function(){
				let me = this,
					mainMenuBgMoveStep = 0,
					bgScrollTimer = undefined;

				/*
				* 当游戏处于暂停状态且主菜单显示时，背景按每秒60帧的速度向左移动
				* 移动距离超过一屏，则回到起点重新开始
				* */
				bgScrollTimer = setInterval(function(){
					if(!me.paused && me.mainMenuShow){
						me.mainMenuBg.style.backgroundPosition = mainMenuBgMoveStep-- + 'px 0px';
						if(Math.abs(mainMenuBgMoveStep) > me.canvas.width) mainMenuBgMoveStep = 0;
					} else {
						clearInterval(bgScrollTimer);
					}
				}, 1000 / 60);
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
							_nodesSet[singleNode].node.style.backgroundPosition = _nodesSet[singleNode].location.join(' ') + 'px';
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

