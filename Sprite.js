"use strict";

let Sprite = function (name, painter, behaviors) {
	if (name !== undefined) { this.name = name; }
	if (painter !== undefined) { this.painter = painter; }

	this.top = 0;
	this.left = 0;
	this.width = 10;
	this.height = 10;
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
		if (this.cellIndex == this.cells.length - 1) {
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