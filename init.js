"use strict";

const CANVAS = document.getElementById('canvas');// 获取画布
const CTX = CANVAS.getContext('2d');// 获取绘图环境
CANVAS.setAttribute('width', window.screen.width/* * window.devicePixelRatio */ + 'px');
CANVAS.setAttribute('height', window.screen.height/* * window.devicePixelRatio*/ + 'px');

const SCREEN_HEIGHT_IN_METERS = 100;// 假设屏幕高度为实际米数
const PIXELS_PER_METER = CANVAS.height / SCREEN_HEIGHT_IN_METERS;// 设置1米等于多少像素
const G_IN_GAME = 9.8 * PIXELS_PER_METER;// 游戏中重力加速度(像素 / 二次方秒)
const V_UPWARD = -100;// 单次点击给小鸟向上的初速度(像素 / 秒)

let game = new Game('FlappyBird', 'canvas');// 创建一个新游戏

//-----------------------创建玩家，玩家行为
let birdSheet = new Image();// 创建新的玩家表
	birdSheet.src = 'img/bird_sheet.png';// 玩家表的路径
let	birdCells = [{x:0, y:0, w:80, h:58},{x:80, y:0, w:80, h:58},{x:160, y:0, w:80, h:58},];// 玩家表每个图片的裁切位置
let	birdBehaviors = [// 存储小鸟的所有行为
		{// 更新精灵表
			lastAdvance: 0,
			PAGEFLIP_INTERVAL: 200,
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
				sprite.t = sprite.t + 0.1;
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
				if( game.level === 'normal' ){
					sprite.left -= 3;
					if( sprite.left + sprite.width < 0 ){// 如果水管已经移出左边界，则从allPipes中删除该组水管连同其index，不让数组长度无限制增加
						allPipes.splice(0, 1);
					}
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
				sprite.left -= 0.5;
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
let birdFly = document.getElementById('birdFly');// 获取小鸟容器
let clipX = 0;// 小鸟图片裁切X值(backgroundPosition样式)
let progressBarBox = document.getElementById('progressBarBox');// 获取进度条
let progressBar = document.getElementById('progressBar');// 获取进度条当前进度
let loadingText = document.getElementById('loadingText');// 获取当前进度百分比

//-----------------------主菜单页面相关
let mainMenuBg = document.getElementById('mainMenuBg');// 获取主菜单背景
let easyLevel = document.getElementById('easyLevel');// 获取简单难度按钮
let normalLevel = document.getElementById('normalLevel');// 获取中等难度按钮
let hardLevel = document.getElementById('hardLevel');// 获取困难难度按钮
let startGame = document.getElementById('startGame');// 获取开始按钮

//-----------------------图片加载
game.queueImage('img/bg.png');
game.queueImage('img/start_game_btn.png');
game.queueImage('img/level_label.png');
game.queueImage('img/level_easy_btn.png');
game.queueImage('img/level_normal_btn.png');
game.queueImage('img/level_hard_btn.png');
game.queueImage('img/cutting_line.png');
game.queueImage('img/main_menu_bg.png');
game.queueImage('img/bird_sheet.png');
game.queueImage('img/loading_text.png');
game.queueImage('img/pipe_downward.png');
game.queueImage('img/pipe_upward.png');

// loadingInterval = setInterval(function(){// 循环调用loadImages()方法加载图片
// 	loadingComplete = game.loadImages();// 开始加载图片，返回完成百分比

// 	if(loadingComplete === 100){// 加载完毕，可能有加载失败的图片
// 		clearInterval(loadingInterval);
// 		setTimeout(function(){// 0.5秒后关闭loading页
// 			document.getElementById('loadingBackground').style.display = 'none';// 关闭loading页
// 		}, 1200);
// 	}
	
// 	birdFly.style.backgroundImage = "url('img/bird_sheet.png')";// 显示小鸟飞翔
// 	clipX = (clipX % 80) < 3 ? clipX : 0;
// 	clipX++;
// 	birdFly.style.backgroundPosition = (clipX % 80) * 80 + 'px 0px';// 裁切
// 	progressBar.style.width = (loadingComplete / 100) * progressBarBox.offsetWidth - 8 + 'px';// 显示进度条当前进度
// 	loadingText.innerText = loadingComplete.toFixed(0) + '%';// 显示当前进度百分比
// }, 50);

//-----------------------添加精灵以及实现引擎部分方法
game.addSprite(bg);// 向游戏里添加背景
game.addSprite(bird);// 向游戏里添加小鸟

game.paintOverSprites = function(time){// 绘制水管
	if( time - lastPaintPipes > paintPipesInterval ){// 每隔一定时间绘制一组水管
		pipes = new Pipes('pipes', new PipesPainter(pipeImageUpward.src, pipeImageDownward.src), pipeBehaviors);// 创建一组水管
		allPipes.push(pipes);// 将水管组存入数组
		lastPaintPipes = time;
	}
	console.log(allPipes.length);

	for( let i = 0; i < allPipes.length; ++i ){
		allPipes[i].update(CTX);// 随着游戏循环的进行，不断更新水管组左边距数值
		allPipes[i].paint(CTX);// 具体绘制
	}
};

game.collisionDetection = function(){// 实现小鸟与各个边界的碰撞

};

game.startAnimate = function(time){// 游戏开始循环的条件以及另外的限制条件
	game.collisionDetection();// 碰撞检测
};

//-----------------------主菜单交互
startGame.addEventListener('click', function(e){
	e.preventDefault();
	e.stopPropagation();
	mainMenuBg.style.display = 'none';// 隐藏主菜单
	game.start();// 开启游戏循环

	CANVAS.addEventListener('click', function(e){// 添加小鸟的点击事件
		e.preventDefault();
		e.stopPropagation();
		bird.t = 0;
		bird.topOrigin = bird.top;
		bird.velocityY = V_UPWARD;
	});
});



