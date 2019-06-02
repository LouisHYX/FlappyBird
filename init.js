"use strict";

const CANVAS = document.getElementById('canvas');// 获取画布
const CTX = CANVAS.getContext('2d');// 获取绘图环境
CANVAS.setAttribute('width', window.screen.width * window.devicePixelRatio);
CANVAS.setAttribute('height', window.screen.height * window.devicePixelRatio);

const G = 10;// 重力加速度
const SCREEN_HEIGHT_IN_METERS = 100;// 设定屏幕高度为100米
const PIXELS_PER_METER = CANVAS.height / SCREEN_HEIGHT_IN_METERS;// 设置1米等于多少像素

let game = new Game('FlappyBird', 'canvas');// 创建一个新游戏

let birdSheet = new Image();// 创建新的玩家表
	birdSheet.src = 'img/bird_sheet.png';// 玩家表的路径
let birdCells = [{x:0, y:0, w:80, h:58},{x:80, y:0, w:80, h:58},{x:160, y:0, w:80, h:58},];// 玩家表每个图片的裁切位置
let birdBehaviors = [// 存储小鸟的所有行为
	{// 控制小鸟翅膀运动
		lastAdvance: 0,
		PAGEFLIP_INTERVAL: 200,
		execute: function(sprite, context, now){
			if( now - this.lastAdvance > this.PAGEFLIP_INTERVAL ){// 间隔固定时间切换精灵表中的下一张图片
				sprite.painter.advance();
				this.lastAdvance = now;
			}
		}
	},
	{// 控制小鸟上下运动
		lastAdvance: 0,
		PAGEFLIP_INTERVAL: 200,
		execute: function(sprite, context, now){
			sprite.top += sprite.velocityY / fps;
		}

	}
];

let bird = new Sprite('bird', new SpriteSheetPainter(birdCells, birdSheet), birdBehaviors);// 创建小鸟

let loadingInterval;// 创建loading页面加载定时器
let loadingComplete = 0;;// 创建loading页面加载定时器
let birdFly = document.getElementById('birdFly');// 获取小鸟容器
let clipX = 0;// 小鸟图片裁切X值(backgroundPosition样式)
let progressBarBox = document.getElementById('progressBarBox');// 获取进度条
let progressBar = document.getElementById('progressBar');// 获取进度条当前进度
let loadingText = document.getElementById('loadingText');// 获取当前进度百分比

let mainMenuBox = document.getElementById('mainMenuBox');// 获取主菜单最外层盒子
let easyLevel = document.getElementById('easyLevel');// 获取简单难度按钮
let normalLevel = document.getElementById('normalLevel');// 获取中等难度按钮
let hardLevel = document.getElementById('hardLevel');// 获取困难难度按钮
let startGame = document.getElementById('startGame');// 获取开始按钮

//-----------------------图片加载
game.queueImage('img/01.png');
game.queueImage('img/02.png');
game.queueImage('img/03.png');
game.queueImage('img/04.png');
game.queueImage('img/05.png');
game.queueImage('img/06.png');
game.queueImage('img/07.png');
game.queueImage('img/08.png');
game.queueImage('img/bird_sheet.png');
game.queueImage('img/loading_text.png');

// loadingInterval = setInterval(function(){// 循环调用loadImages()方法加载图片
// 	loadingComplete = game.loadImages();// 开始加载图片，返回完成百分比

// 	if(loadingComplete === 100){// 加载完毕，可能有加载失败的图片
// 		clearInterval(loadingInterval);
// 		setTimeout(function(){// 0.5秒后关闭loading页
// 			document.getElementById('loadingBackground').style.display = 'none';// 关闭loading页
// 		}, 1000);
// 	}
	
// 	birdFly.style.backgroundImage = "url('img/bird_sheet.png')";// 显示小鸟飞翔
// 	clipX = (clipX % 80) < 3 ? clipX : 0;
// 	clipX++;
// 	birdFly.style.backgroundPosition = (clipX % 80) * 80 + 'px 0px';// 裁切
// 	progressBar.style.width = (loadingComplete / 100) * progressBarBox.offsetWidth - 8 + 'px';// 显示进度条当前进度
// 	loadingText.innerText = loadingComplete + '%';// 显示当前进度百分比
// }, 30);

//-----------------------添加精灵
game.addSprite(bird);// 向游戏里添加小鸟
bird.top = 100;// 小鸟初始离顶端位置
bird.left = 70;// 小鸟初始离左端位置

//-----------------------主菜单交互
startGame.addEventListener('click', function(e){
	e.stopPropagation();
	mainMenuBox.style.display = 'none';// 隐藏主菜单
	game.start();// 开启游戏循环
});



