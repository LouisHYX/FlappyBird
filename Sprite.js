"use strict";

let Sprite = function (name, painter, behaviors) {
	if (name !== undefined) { this.name = name; }
	if (painter !== undefined) { this.painter = painter; }

	this.t = 0;
	this.top = 0;
	this.topOrigin = 100;
	this.left = 0;
	this.width = 52;
	this.height = 52;
	this.blankHeight = 10;// 小鸟的图片空白高度(为了更精确计算碰撞)
	this.velocityX = 0;
	this.velocityY = 0;
	this.visible = true;
	this.animating = false;
	this.behaviors = behaviors || [];

	return this;
};

Sprite.prototype = {
	constructor: Sprite,
	paint: function (context) {
		if (this.painter !== undefined && this.visible) {
			this.painter.paint(this, context);
		}
	},
	update: function (context, time) {
		for (let i = 0; i < this.behaviors.length; ++i) {
			this.behaviors[i].execute(this, context, time);
		}
	}
};

let Pipes = function (name, painter, behaviors) {// 水管构造器继承自Sprite
	Sprite.call(this, name, painter, behaviors);// 继承Sprite的属性

	this.width = 76;
	this.height = 530;
	this.left = window.screen.width;
	this.gap = Math.floor(Math.random() * (360 - 140) + 140);// 上下水管之间的间距
	this.top = Math.floor(Math.random() * (0 - (-this.height)) + (-this.height));

	// 一般情况下，下水管top值等于gap高度加上上水管在屏幕可见的高度,但如果下水管与屏幕下边界产生间隙，则将下水管紧贴屏幕下边界。
	if( this.gap + (this.height - Math.abs(this.top)) + this.height >= window.screen.height ){
		this.topUpward = this.gap + (this.height - Math.abs(this.top));
	} else {
		this.topUpward = window.screen.height - this.height;
	}

	return this;
};

Pipes.prototype = new Sprite();// 继承Sprite的方法

let PipesPainter = function (imageUrlUpward, imageUrlDownward) {// 水管专用画笔
	this.imageUpward = new Image();
	this.imageDownward = new Image();
	this.imageUpward.src = imageUrlUpward;
	this.imageDownward.src = imageUrlDownward;
};

PipesPainter.prototype = {
	constructor: PipesPainter,
	paint: function (sprite, context) {
		if (this.imageUpward.complete && this.imageDownward.complete) {
			context.drawImage(this.imageDownward, sprite.left, sprite.top, sprite.width, sprite.height);
			context.drawImage(this.imageUpward, sprite.left, sprite.topUpward, sprite.width, sprite.height);
		}
	}
};

let ImagePainter = function (imageUrl) {
	this.image = new Image();
	this.image.src = imageUrl;
};

ImagePainter.prototype = {
	constructor: ImagePainter,
	paint: function (sprite, context) {
		if (this.image.complete) {
			context.drawImage(this.image, sprite.left, sprite.top, sprite.width, sprite.height);
		}
	}
};

let SpriteSheetPainter = function (cells, spriteSheet) {
	this.cells = cells || [];
	this.cellIndex = 0;
	this.spriteSheet = spriteSheet || {};
};

SpriteSheetPainter.prototype = {
	constructor: SpriteSheetPainter,
	advance: function () {
		if (this.cellIndex === this.cells.length - 1) {
			this.cellIndex = 0;
		} else {
			this.cellIndex++;
		}
	},
	paint: function (sprite, context) {
		let cell = this.cells[this.cellIndex];
		context.drawImage(this.spriteSheet, cell.x, cell.y, cell.w, cell.h, sprite.left, sprite.top, cell.w, cell.h);
	}
};