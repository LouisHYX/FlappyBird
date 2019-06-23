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
	* 精灵绘制工具
	* 包括：单张图片绘制，精灵表绘制
	* */
	TOOL: function(){

	},

	/*
	* 精灵
	* 只关注自身属性，具体绘制与行为从中分离
	* */
	SPRITE: function(){
		let Sprite = function(){

		};

		Sprite.prototype = {

		};


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
			this.ctx = this.canvas.getContext('2d'); // 绘图环境
			this.gamelevel = 'normal'; // 默认游戏难度
			this.listeners = [ // 存放所有监听器及对应的事件处理方法
				{
					listener: this.canvas,
					handle: function (e) {
						e.preventDefault();
						e.stopPropagation();

						// 给小鸟一个向上的初速度
					}
				},
				{
					listener: this.mainMenuBox,
					handle: function (e, me) {
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
								// me.animate(); // 开启循环
								break;
						}
					}
				}
			];

			/*菜单*/
			this.mainMenuShow = false; // 主菜单是否显示

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
			this.paused = false;






			this.bindTouchEvent(this.listeners); // 开启手指点击事件

		};

		Engine.prototype = {

			/*
			* 游戏启动
			* 显示loading页，资源加载动画
			* 加载完毕后隐藏loading页，显示主菜单
			* */
			init: function(){
				let me = this;

				/*图片加载*/
				this.birdFly.src = 'images/bird_fly.gif';
				this.birdFly.onload = function(){
					me.imagesLoader(FlappyBird.ASSET.imageUrls);
					me.loadingBg.style.display = 'block';
				};
			},

			/*
			* 游戏循环
			* */
			start: function(){

				this.mainMenuBg.style.display = 'block'; // 显示主菜单
				this.mainMenuShow = true; // 显示标识设为true

				this.setGameLevel(); // 设置游戏难度

				this.mainMenuBgScroll(); // 主菜单大背景滚动

			},
			animate: function(time){
				let me = this;

				requestNextAnimationFrame(function(time){
					me.animate.call(me, time);
				});
			},

			/*
			* 设置游戏难度
			* 默认为'normal'难度，如果玩家自己点击按钮更换难度，则切换该按钮的贴图
			* offsetWidth属性值必须在其父盒子没有设置display: none的情况下才能获取到
			* */
			setGameLevel: function(me, touchTarget){
				let	self = me || this,
					levelButton = touchTarget || undefined;

				if(levelButton && FlappyBird.NODE.hasOwnProperty(levelButton.id)){
					levelButton.style.backgroundPosition = -levelButton.offsetWidth + 'px ' + FlappyBird.NODE[levelButton.id].location[1] + 'px';
					self.gamelevel = levelButton.getAttribute('data-level');
				} else {
					self.normalLevel.style.backgroundPosition = -this.normalLevel.offsetWidth + 'px ' + FlappyBird.NODE.normalLevel.location[1] + 'px';
					self.gamelevel = 'normal';
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
						if(Math.abs(mainMenuBgMoveStep) > window.screen.width) mainMenuBgMoveStep = 0;
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
				for(let singleNode in nodesSet){
					if(nodesSet.hasOwnProperty(singleNode) && nodesSet[singleNode].render){
						if(nodesSet[singleNode].node.id !== this.mainMenuBg.id){
							nodesSet[singleNode].node.style.backgroundImage = 'url("images/maps.png")';/*之后用this.images代替*/
						} else {
							nodesSet[singleNode].node.style.backgroundImage = 'url("images/bg.png")';/*之后用this.images代替*/
						}
						nodesSet[singleNode].node.style.backgroundPosition = nodesSet[singleNode].location.join(' ') + 'px';
						nodesSet[singleNode].node.style.backgroundRepeat = 'no-repeat';

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
					image = new Image(),
					reg = new RegExp('\\\\(.*?).');/*\?(.*?)!*/

				image.src = imageUrl;

				image.addEventListener('load', function(){
					me.imagesLoaded++;
				});

				image.addEventListener('error', function(){
					me.imagesFailed++;
				});

				/*
				* 正则匹配
				* 取出的图片名称作为属性，并以对应图片路径作为值存入images对象中
				* */
				this.images[imageUrl.match(reg)] = imageUrl;
				console.log(imageUrl.match(reg));
				console.log(me.images);
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
						me.listeners[i].handle(e, me);
					});
				}
			},


		};

		return new Engine();
	},

	



};

FlappyBird.ENGINE().init();

