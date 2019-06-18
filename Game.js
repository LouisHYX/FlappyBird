"use strict";

let getTimeNow = function () {
	return +new Date();
};

let Game = function (gameName, canvasId) {
	let canvas = document.getElementById(canvasId);
	let self = this;

	// 通用
	this.context = canvas.getContext('2d');
	this.gameName = gameName;
	this.sprites = [];
	this.keyListeners = [];
	this.level = 'normal';// 默认游戏难度
	this.isOver = false;// 判断游戏是否结束

	// 高分榜
	this.scores = 0;// 当前得分
	this.HIGH_SCORES_SUFFIX = '_highscores';

	// 图像加载
	this.imageLoadingProgressCallback;
	this.images = {};
	this.imageUrls = [];
	this.imagesLoaded = 0;
	this.imagesFailedToLoad = 0;
	this.imagesIndex = 0;

	// 音效加载
	this.audioUrls = [];
	this.audiosIndex = 0;

	this.resourceUrls = [];
	this.resourcesIndex = 0;
	this.resourcesLoaded = 0;
	this.resourcesFailedToLoad = 0;

	// 时间
	this.startTime = 0;
	this.lastTime = 0;
	this.gameTime = 0;
	this.fps = 0;
	this.STARTING_FPS = 60;

	this.paused = false;
	this.startedPauseAt = 0;
	this.PAUSED_TIMEOUT = 100;

	// 音效
	this.soundOn = true;
	this.soundChannels = [];
	this.audio = new Audio();
	this.NUM_SOUND_CHANNELS = 10;

	for (let i = 0; i < this.NUM_SOUND_CHANNELS; ++i) {
		let audio = new Audio();
		this.soundChannels.push(audio);
	}

	// window.onkeypress = function (e) { self.keyPressed(e); };
	// window.onkeydown = function (e) { self.keyPressed(e); };

	return this;
};

Game.prototype = {
	// 加载资源
	getImage: function (imageUrl) {
        return this.images[imageUrl];
    },
    loadResource: function (imageUrl) {
		let self = this;
		let image = new Image();

        image.src = imageUrl;

        image.addEventListener('load', function (e) {
            self.imagesLoaded++;
        });

        image.addEventListener('error', function (e) {
            self.imagesFailedToLoad++;
        });

        this.images[imageUrl] = image;
    },
    loadResources: function () {
        // if (this.resourcesIndex < this.resourceUrls.length) {
        //     this.loadResource(this.resourceUrls[this.resourcesIndex]);
        //     this.resourcesIndex++;
        // }
		if (this.imagesIndex < this.imageUrls.length) {
			this.loadResource(this.imageUrls[this.imagesIndex]);
			this.imagesIndex++;
		}


		return (this.imagesLoaded + this.imagesFailedToLoad) / this.imageUrls.length * 100;
    },
	queueResource: function (resources) {
		for( let resource in resources ){
			for( let i = 0; i < resources[resource].length; ++ i){
				if( resource === 'images' ){
					this.imageUrls.push(resources[resource][i]);
				}
				if( resource === 'audios' ){
					this.audioUrls.push(resources[resource][i]);
				}
			}
		}
    },

	// 游戏循环
	start: function () {
		let self = this;
		this.startTime = getTimeNow();
		window.requestNextAnimationFrame(function (time) {

			self.animate.call(self, time);
		});
	},
	animate: function (time) {
		let self = this;

		if(!this.isOver){
			if (this.paused) {
				setTimeout(function () {
					self.animate.call(self, time);
				}, this.PAUSED_TIMEOUT);
			} else {
				this.tick(time);
				this.clearScreen();

				this.startAnimate(time);
				this.paintUnderSprites();

				this.updateSprites(time);
				this.paintSprites(time);

				this.paintOverSprites(time);
				this.endAnimate();

				window.requestNextAnimationFrame(function (time) {
					self.animate.call(self, time);
				});
			}
		}else {
			return;
		}
	},
	tick: function (time) {
		this.updateFrameRate(time);
		this.gameTime = (getTimeNow()) - this.startTime;
		this.lastTime = time;
	},
	updateFrameRate: function (time) {
		if (this.lastTime === 0) {
			this.fps = this.STARTING_FPS
		} else {
			this.fps = 1000 / (time - this.lastTime);
		}
	},
	clearScreen: function () {
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	},
	updateSprites: function (time) {
		for (let i = 0; i < this.sprites.length; ++i) {
			let sprite = this.sprites[i];
			sprite.update(this.context, time);
		}
	},
	paintSprites: function (time) {
		for (let i = 0; i < this.sprites.length; ++i) {
			let sprite = this.sprites[i];
			if (sprite.visible) {
				sprite.paint(this.context);
			}
		}
	},
	togglePaused: function () {
		let now = getTimeNow();

		this.paused = !this.paused;

		if (this.paused) {
			this.startedPauseAt = now;
		} else {
			this.startTime = this.startTime + now - this.startedPauseAt;
			this.lastTime = now;
		}
	},
	pixelsPerFrame: function (velocity) {
		return velocity / this.fps;
	},

	// 高分榜
	getHighScores: function () {
		let key = this.gameName + this.HIGH_SCORES_SUFFIX;
		let highScoresString = localStorage[key];

		if (highScoresString == undefined) {
			localStorage[key] = JSON.stringify([]);
		}
		return JSON.parse(localStorage[key]);
	},
	setHighScore: function (highScore) {
		let key = this.gameName + this.HIGH_SCORES_SUFFIX;
		let highScoresString = localStorage[key];

		highScores.unshift(highScore);
		localStorage[key] = JSON.stringify(highScores);
	},
	clearHighScores: function () {
		localStorage[this.gameName + this.HIGH_SCORES_SUFFIX] = JSON.stringify([]);
	},

	// 键盘事件
	addKeyListener: function (keyAndListener) {
		this.keyListeners.push(keyAndListener);
	},
	findKeyListener: function (key) {
		let listener = undefined;

		for (let i = 0; i < this.keyListeners.length; ++i) {
			let keyAndListener = this.keyListeners[i];
			let currentKey = keyAndListener.key;
			if (currentKey === key) {
				listener = keyAndListener.listener;
			}
		}
		return listener;
	},
	keyPressed: function (e) {
		let listener = undefined;
		let key = undefined;

		switch (e.keyCode) {
			case 32: key = 'space'; break;
			case 68: key = 'd'; break;
			case 75: key = 'k'; break;
			case 83: key = 's'; break;
			case 80: key = 'p'; break;
			case 37: key = 'left arrow'; break;
			case 39: key = 'right arrow'; break;
			case 38: key = 'up arrow'; break;
			case 40: key = 'down arrow'; break;
		}
		listener = this.findKeyListener(key);
		if (listener) {
			listener();
		}
	},

	// 音效
	canPlayOggVorbis: function () {
		return "" != this.audio.canPlayType('audio/ogg; codecs="vorbis"');
	},
	canPlayMp3: function () {
		return "" != this.audio.canPlayType('audio/mpeg');
	},
	getAvailableSoundChannel: function () {
		let audio;

		for (let i = 0; i < this.NUM_SOUND_CHANNELS; ++i) {
			audio = this.soundChannels[i];
			if (audio.played && audio.played.length > 0) {
				if (audio.ended) {
					return audio;
				}
			} else {
				if (!audio.ended) {
					return audio;
				}
			}
		}
		return undefined;
	},
	playSound: function (id) {
		let channel = this.getAvailableSoundChannel();
		let element = document.getElementById(id);

		if (channel && element) {
			channel.src = element.src === '' ? element.currentSrc : element.src;
			channel.load();
			channel.play();
		}
	},

	// 精灵
	addSprite: function (sprite) {
		this.sprites.push(sprite);
	},
	getSprite: function (name) {
		for (let i in this.sprites) {
			if (this.sprites[i].name === name){
				return this.sprites[i];
			}
		}
		return null;
	},
	startAnimate: function (time) {},
	paintUnderSprites: function () {},
	paintOverSprites: function (time) {},
	endAnimate: function () {},
	collisionDetection: function () {},
	gameOver: function (time) {},
	playerDeadAnimation: function () {}
};






