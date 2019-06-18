"use strict";

const CANVAS = document.getElementById('canvas');// 获取画布
const CTX = CANVAS.getContext('2d');// 获取绘图环境
CANVAS.setAttribute('width', window.screen.width/* * window.devicePixelRatio */ + 'px');
CANVAS.setAttribute('height', window.screen.height/* * window.devicePixelRatio*/ + 'px');

const SCREEN_HEIGHT_IN_METERS = 100;// 假设屏幕高度为实际米数
const PIXELS_PER_METER = CANVAS.height / SCREEN_HEIGHT_IN_METERS;// 设置1米等于多少像素
const G_IN_GAME = 9.8 * PIXELS_PER_METER;// 游戏中重力加速度(像素 / 二次方秒)
const V_UPWARD = -80;// 单次点击给小鸟向上的初速度(像素 / 秒)

let game = new Game('FlappyBird', 'canvas');// 创建一个新游戏

//-----------------------创建玩家，玩家行为
let birdSheet = new Image();// 创建新的玩家表
	birdSheet.src = 'img/bird_sheet.png';// 玩家表的路径
let	birdCells = [{x:0, y:0, w:52, h:52},{x:52, y:0, w:52, h:52},{x:104, y:0, w:52, h:52},{x:156, y:0, w:52, h:52},{x:208, y:0, w:52, h:52},{x:260, y:0, w:52, h:52}];// 玩家表每个图片的裁切位置
let	birdBehaviors = [// 存储小鸟的所有行为
		{// 更新精灵表
			lastAdvance: 0,
			PAGEFLIP_INTERVAL: 140,
			execute: function(sprite, context, now){
				if( now - this.lastAdvance > this.PAGEFLIP_INTERVAL ){// 间隔固定时间切换精灵表中的下一张图片
					sprite.painter.advance();// 更新精灵表中的图片位置
					this.lastAdvance = now;
				}
			}
		},
		{// 控制小鸟上下运动
			execute: function(sprite, context, now){
				sprite.top = sprite.topOrigin + sprite.velocityY * sprite.t + G_IN_GAME * Math.pow(sprite.t, 2) / 2;// 根据自由落体公式统一单位后计算小鸟的位置
				sprite.t += 0.1;
			}
		}
	];
let	bird = new Sprite('bird', new SpriteSheetPainter(birdCells, birdSheet), birdBehaviors);// 创建小鸟
	bird.left = 70;// 小鸟初始离左端位置

//-----------------------创建水管，水管行为
let pipeImageUpward = new Image();// 创建下水管图片
	pipeImageUpward.src = 'img/pipe_upward.png';// 下水管图片的路径
let pipeImageDownward = new Image();// 创建上水管图片
	pipeImageDownward.src = 'img/pipe_downward.png';// 上水管图片的路径
let	pipeBehaviors = [// 存储水管的所有行为
		{
			execute: function(sprite, context, now){
				if( game.level === 'easy' ){
					sprite.left -= 2;
				}
				if( game.level === 'normal' ){
					sprite.left -= 3;
				}
				if( game.level === 'hard' ){
					sprite.left -= 4;	
				}
				if( sprite.left + sprite.width < 0 ){// 如果水管已经移出左边界，则从allPipes中删除该组水管连同其index，不让数组长度无限制增加
						allPipes.splice(0, 1);
					}
			}
		},
	];
let allPipes = new Array(0);// 存储多组上下水管
let pipes = {};// 保存一组水管
let paintPipesInterval = 2000;// 绘制水管组的默认时间间隔
let lastPaintPipes = 0;// 绘制上一组水管的时间

//-----------------------创建背景，背景行为
let bgImage = new Image();// 创建背景图片
	bgImage.src = 'img/bg.png';// 背景的路径
let	bgBehaviors = [// 存储背景的所有行为
		{// 背景向左移动
			execute: function(sprite, context, now){
				if( game.level === 'easy' ){
					sprite.left -= 0.2;
				}
				if( game.level === 'normal' ){
					sprite.left -= 0.3;
				}
				if( game.level === 'hard' ){
					sprite.left -= 0.4;
				}
				if( sprite.left <= -CANVAS.width ){// 在屏幕上循环播放背景
					sprite.left = 0;
				}
			}
		}
	];
let	bg = new Sprite('bg', new ImagePainter(bgImage.src), bgBehaviors);// 创建背景
	bg.width = CANVAS.width * 2;
	bg.height = CANVAS.height;

//-----------------------loading页面相关
let loadingInterval;// 创建loading页面加载定时器
let loadingComplete = 0;// 创建loading页面加载定时器
let loadingBackground = document.getElementById('loadingBackground');// 获取loading页外盒子
let birdFly = document.getElementById('birdFly');// 获取小鸟容器
let clipX = 0;// 小鸟图片裁切X值(backgroundPosition样式)
let progressBarBox = document.getElementById('progressBarBox');// 获取进度条
let progressBar = document.getElementById('progressBar');// 获取进度条当前进度
let loadingText = document.getElementById('loadingText');// 获取当前进度百分比
let bifrFlyOrient = 'upward';// 小鸟飞行方向['upward', 'downward']

//-----------------------主菜单页面相关
let mainMenuBg = document.getElementById('mainMenuBg');// 获取主菜单背景
let easyLevel = document.getElementById('easyLevel');// 获取简单难度按钮
let normalLevel = document.getElementById('normalLevel');// 获取中等难度按钮
let hardLevel = document.getElementById('hardLevel');// 获取困难难度按钮
let startGame = document.getElementById('startGame');// 获取开始按钮
let menuShow = false;// 主菜单是否显示
let mainMenuBgMoveTimer = undefined;// 主菜单背景运动计时器
let mainMenuBgMoveStep = 0;// 主菜单背景运动步长

//-----------------------游戏界面相关
let scoresBoardBox = document.getElementById('scoresBoardBox');// 获取得分面板外框
let scores = document.getElementById('scores');// 获取得分显示框

//-----------------------设置菜单
// let setting = document.getElementById('setting');// 获取设置按钮
// let settingMenuBg = document.getElementById('settingMenuBg');// 获取设置菜单背景
// let continueGame = document.getElementById('continueGame');// 获取继续按钮
// let exitGame = document.getElementById('exitGame');// 获取退出按钮

//-----------------------死亡菜单
let deadMenuBg = document.getElementById('deadMenuBg');// 获取死亡菜单背景
let restartGame = document.getElementById('restartGame');// 获取重玩按钮
let goMainMenu = document.getElementById('goMainMenu');// 获取跳转主菜单按钮
let exitGame = document.getElementById('exitGame');// 获取退出按钮
let deadAnimationTimer = undefined;// 创建死亡动画定时器

//-----------------------资源加载
game.queueResource({
	images: ['img/bg.png', 'img/start_game_btn.png', 'img/level_label.png', 'img/level_easy_btn.png', 'img/level_normal_btn.png', 'img/level_hard_btn.png', 'img/cutting_line.png', 'img/main_menu_bg.png', 'img/bird_sheet.png', 'img/deadbird_sheet.png', 'img/loading_text.png', 'img/pipe_downward.png', 'img/pipe_upward.png', 'img/setting.png', 'img/restart_game_btn.png', 'img/exit_game_btn.png', 'img/setting_menu_bg.png', 'img/continue_game_btn.png', 'img/scores_label.png'],
	audios: ['audio/bird_fly.mp3', 'click.mp3', 'audio/game_over.mp3']
});

loadingInterval = setInterval(function(){// 循环调用loadImages()方法加载资源
	loadingComplete = game.loadResources();// 开始加载资源，返回完成百分比

	if(loadingComplete === 100){// 加载完毕，可能有加载失败的资源
		clearInterval(loadingInterval);
		setTimeout(function(){// 一定时间后关闭loading页
			loadingBackground.style.display = 'none';// 关闭loading页
			mainMenuBg.style.display = 'block';// 显示主菜单
			menuShow = true;
			mainMenuBgMoveTimer = setInterval(mainMenuBgMove , 1000 / 60);// 主菜单背景开始运动
		}, 1200);
	}

	birdFly.style.backgroundImage = "url('img/bird_sheet.png')";// 显示小鸟飞翔

	//loading页小鸟上下运动
	if( bifrFlyOrient === 'upward' ){
		birdFly.style.top = birdFly.offsetTop - 3 + 'px';
		if( birdFly.offsetTop < 22 ){
			bifrFlyOrient = 'downward';
		}
	} else if( bifrFlyOrient === 'downward' ) {
		birdFly.style.top = birdFly.offsetTop + 3 + 'px';
		if( birdFly.offsetTop > 26 ){
			bifrFlyOrient = 'upward';
		}
	}

	//loading页小鸟图片切换
	clipX = (clipX % 52) < 6 ? clipX : 0;
	clipX++;
	birdFly.style.backgroundPosition = (clipX % 52) * 52 + 'px 0px';// 裁切
	progressBar.style.width = (loadingComplete / 100) * progressBarBox.offsetWidth + 'px';// 显示进度条当前进度
	loadingText.innerText = '资源加载中...' + loadingComplete.toFixed(0) + '%';// 显示当前进度百分比
}, 50);

function mainMenuBgMove(){
	if( menuShow ){
		mainMenuBg.style.backgroundPosition = mainMenuBgMoveStep-- + 'px 0px';
		if( Math.abs(mainMenuBgMoveStep) > window.screen.width ){
			mainMenuBgMoveStep = 0;
		}
	} else {
		clearInterval(mainMenuBgMoveTimer);
		return;
	}
}

//-----------------------添加精灵以及实现引擎部分方法
game.addSprite(bg);// 向游戏里添加背景
game.addSprite(bird);// 向游戏里添加小鸟

game.paintOverSprites = function(time){// 绘制水管
	if( time - lastPaintPipes > paintPipesInterval ){// 每隔一定时间绘制一组水管
		pipes = new Pipes('pipes', new PipesPainter(pipeImageUpward.src, pipeImageDownward.src), pipeBehaviors);// 创建一组水管
		allPipes.push(pipes);// 将水管组存入数组
		lastPaintPipes = time;
	}

	for( let i = 0; i < allPipes.length; ++i ){
		allPipes[i].update(CTX);// 随着游戏循环的进行，不断更新水管组左边距数值
		allPipes[i].paint(CTX);// 具体绘制
	}
};

game.collisionDetection = function(){// 实现小鸟与各个边界的碰撞
	//------------小鸟与水管碰撞
	for( let i = 0; i < allPipes.length; ++i ){
		if( allPipes[i].left <= bird.left + bird.width && allPipes[i].left + allPipes[i].width > bird.left + 12/*这里的12px是小鸟尾巴的宽度，不计入碰撞*/ ){
			if( allPipes[i].height - Math.abs(allPipes[i].top) > bird.top + bird.blankHeight || allPipes[i].height - Math.abs(allPipes[i].top) + allPipes[i].gap < bird.top + bird.height - bird.blankHeight ){
				game.isOver = true;
				game.playerDeadAnimation()// 小鸟死亡动画
			}
		} else if( allPipes[i].left + allPipes[i].width === bird.left ){// 如果小鸟顺利通过水管，则得分
			game.scores += 10;
			scores.innerText = parseInt(scores.innerText) + 10;
		}
	}

	//------------小鸟飞太低
	if( bird.top > CANVAS.height ){
		game.isOver = true;
		setTimeout(function(){
			deadMenuBg.style.display = 'block';// 弹出游戏菜单
		} ,500);
	}
};

game.playerDeadAnimation = function(){// 小鸟死亡动画
	// 创建死亡的小鸟
	let deadBird = document.createElement('div');
	let deadBird_v = -140;
	let deadBird_t = 0;
	let deadBird_top = bird.top + 'px';// 死亡小鸟原始top值
	deadBird.style.width = '56px';
	deadBird.style.height = '52px';
	deadBird.style.background = 'url("img/deadbird_sheet.png")';
	deadBird.style.backgroundPosition = '0 0';
	deadBird.style.position = 'absolute';
	deadBird.style.top = bird.top + 'px';
	deadBird.style.left = bird.left + 'px';
	document.body.appendChild(deadBird);

	bird.visible = false;// 隐藏原始小鸟

	setTimeout(function(){
		deadAnimationTimer = setInterval(function(){// 播放死亡动画

			deadBird.style.top = parseInt(deadBird_top) + deadBird_v * deadBird_t + G_IN_GAME * Math.pow(deadBird_t, 2) / 2 + 'px';// 根据自由落体公式统一单位后计算死亡小鸟的位置
			deadBird_v += 1;
			deadBird_t += 0.2;

			if( deadBird_t <= 2 ){
				deadBird.style.backgroundPosition = '112px 0';
			} else if( deadBird_t > 2 ) {
				deadBird.style.backgroundPosition = '56px 0';
			}

			if( deadBird.offsetTop > CANVAS.height ){// 小鸟飞出屏幕后，间隔一定时间显示菜单
				document.body.removeChild(deadBird);// 删除死亡的小鸟
				clearInterval(deadAnimationTimer);// 清除该定时器
				setTimeout(function(){
					deadMenuBg.style.display = 'block';// 弹出游戏菜单
				} ,500);
			}
		}, 30);
	}, 500);
};

game.startAnimate = function(time){// 游戏开始循环的条件以及另外的限制条件
	game.collisionDetection();// 碰撞检测
};

game.gameOver = function(time){// 游戏结束需要的重置操作
	// 得分重置
	game.scores = 0;

	// 游戏时间相关重置
	game.isOver = false;
	game.startTime = 0;
	game.lastTime = 0;
	game.gameTime = 0;
	game.fps = 0;
	game.STARTING_FPS = 60;
	game.startedPauseAt = 0;
	game.PAUSED_TIMEOUT = 100;

	// 小鸟数值重置
	bird.top = 0;
	bird.topOrigin = 100;
	bird.t = 0;
	bird.velocityY = 0;
	bird.visible = true;

	// 水管数据重置
	allPipes.splice(0, allPipes.length);
	pipes = {};
	lastPaintPipes = 0;

	// 主菜单不显示
};

//-----------------------菜单交互
startGame.onclick = function(e){
	e.stopPropagation();

	// 重置游戏数值
	game.gameOver();

	menuShow = false;
	mainMenuBg.style.display = 'none';// 隐藏主菜单
	scoresBoardBox.style.display = 'block';// 显示得分面板

	game.start();// 开启游戏循环

	// 玩家选择不同难度，水管绘制时间间隔不同
	if( game.level === 'easy' ){
		paintPipesInterval = 3000;
	}

	if( game.level === 'hard' ){
		paintPipesInterval = 1200;
	}

	CANVAS.onclick = function(e){// 添加小鸟的点击事件
		e.stopPropagation();
		if( !game.paused ){// 如果游戏没有停止，则可以点击
			bird.t = 0;
			bird.topOrigin = bird.top;
			if( bird.top > 0 ){// 如果飞太高，则不能让他过多的超出上边界
				bird.velocityY = V_UPWARD;
			} else {
				bird.velocityY = 0;
			}
		}
	};
};

easyLevel.onclick = function(e){
	e.stopPropagation();
	normalLevel.style.backgroundPosition = '0 0';
	hardLevel.style.backgroundPosition = '0 0';
	easyLevel.style.backgroundPosition = '0 -48px';
	game.level = 'easy';
};

normalLevel.onclick = function(e){
	e.stopPropagation();
	easyLevel.style.backgroundPosition = '0 0';
	hardLevel.style.backgroundPosition = '0 0';
	normalLevel.style.backgroundPosition = '0 -48px';
	game.level = 'normal';
};

hardLevel.onclick = function(e){
	e.stopPropagation();
	easyLevel.style.backgroundPosition = '0 0';
	normalLevel.style.backgroundPosition = '0 0';
	hardLevel.style.backgroundPosition = '0 -48px';
	game.level = 'hard';
};

restartGame.onclick = function(e){
	e.stopPropagation();
	deadMenuBg.style.display = 'none';// 关闭当前菜单
	game.gameOver();
	game.start();// 开启游戏循环
};

goMainMenu.onclick = function(e){
	e.stopPropagation();
	deadMenuBg.style.display = 'none';// 关闭当前菜单
	mainMenuBg.style.display = 'block';// 打开主菜单
	menuShow = true;
	mainMenuBgMoveTimer = setInterval(mainMenuBgMove , 1000 / 60);// 主菜单背景开始运动
};

exitGame.onclick = function(e){
	e.stopPropagation();
	window.opener = null;
	window.open('', '_self');
	window.close();
};





