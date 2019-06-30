"use strict";

/*
* FlappyBird游戏
* 关键词：原生JS，引擎，精灵，canvas
* */
let FlappyBird = {

    /*
    * 游戏资源
    * 包括：DOM节点，图片
    * */
    ASSET: {

        /*
        * DOM节点
        * 标识哪些需要贴图
        * */
        nodes: {

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
            deathMenuBox: {node: document.getElementById('deathMenuBox'), location: [-260, -554], render: true}, // 结束菜单背景
            scoresLabel: {node: document.getElementById('scoresLabel'), location: [0, -465], render: true}, // 得分标题
            finalScoreBox: {node: document.getElementById('finalScoreBox'), render: false}, // 得分标题
            cuttingLineInDeath: {
                node: document.getElementById('cuttingLineInDeath'),
                location: [0, -480],
                render: true
            }, // 分割线
            restartGame: {node: document.getElementById('restartGame'), location: [0, -104], render: true}, // 重玩按钮
            goMainMenu: {node: document.getElementById('goMainMenu'), location: [0, -52], render: true}, // 跳转主菜单按钮
            exitGame: {node: document.getElementById('exitGame'), location: [0, -156], render: true}, // 退出游戏按钮

            /*设置*/
            setting: {node: document.getElementById('setting'), location: [0, -398], render: true}, // 设置按钮
            settingMenuBox: {node: document.getElementById('settingMenuBox'), location: [0, -818], render: true}, // 设置菜单背景
            musicSwitch: {node: document.getElementById('musicSwitch'), location: [-260, -482], render: true}, // 音乐开关
            soundSwitch: {node: document.getElementById('soundSwitch'), location: [-404, -482], render: true}, // 音效开关
            cuttingLineInSetting: {
                node: document.getElementById('cuttingLineInSetting'),
                location: [0, -480],
                render: true
            }, // 分割线
            getBack: {node: document.getElementById('getBack'), location: [-288, 0], render: true}, // 继续游戏按钮
            confirm: {
                node: document.getElementById('confirm'),
                location: [-288, -52],
                render: true
            }, // 退出游戏按钮

            /*声音*/
            clickSound: {node: document.getElementById('clickSound'), render: false}, // 点击按钮声音
            birdFlySound: {node: document.getElementById('birdFlySound'), render: false}, // 小鸟飞翔声音
            gameOverSound: {node: document.getElementById('gameOverSound'), render: false}, // 小鸟死亡声音
        },

        /*图片url*/
        imageUrls: {
            bg: 'images/bg.png',
            maps: 'images/maps.png',
            spriteSheet: 'images/sprite_sheet.png',
        },

        /*声音url*/
        audioUrls: {
            click: 'audios/click.mp3',
            birdFly: 'audios/bird_fly.mp3',
            gameOver: 'audios/game_over.mp3',
        },
    },

    /*
    * 精灵行为
    * */
    BEHAVIOR: {

        /*小鸟行为集合*/
        birdBehavior: {
            flapWings: function (bird, gameLevel, time) { // 小鸟扇动翅膀
                if (!bird.death) {
                    if (time - bird.lastLocation > 100) {
                        if (bird.locationIndex < bird.location.length - 1) {
                            bird.locationIndex++;
                        } else {
                            bird.locationIndex = 0;
                        }

                        bird.lastLocation = time;
                    }
                }
            },
            fallingBody: function (bird, gameLevel, time) { // 小鸟落体运动
                if (!bird.death) {
                    bird.top = bird.topOrigin + bird.velocityY * bird.t + bird.G_IN_GAME * Math.pow(bird.t, 2) / 2; // 根据自由落体公式统一单位后计算小鸟的位置
                    bird.t += 0.1;
                }
            },
        },

        /*水管行为集合*/
        pipesBehavior: {
            moveToLeft: function (pipes, gameLevel, time) { // 向左移动

                /*根据不同游戏难度设置不同的水管移动速度*/
                switch (gameLevel) {
                    case 'easy':
                        pipes.left -= 2;
                        break;
                    case 'normal':
                        pipes.left -= 3;
                        break;
                    case 'hard':
                        pipes.left -= 4;
                        break;
                }
            },
        },

        /*背景行为集合*/
        gameBgBehavior: {
            moveToLeft: function (gameBg, gameLevel, time) { // 向左移动

                /*根据不同游戏难度设置不同的背景移动速度*/
                switch (gameLevel) {
                    case 'easy':
                        gameBg.left -= 0.2;
                        break;
                    case 'normal':
                        gameBg.left -= 0.5;
                        break;
                    case 'hard':
                        gameBg.left -= 0.8;
                        break;
                }

                /*在屏幕上循环播放背景*/
                if (gameBg.left <= -FlappyBird.ASSET.nodes.canvas.node.width) {
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
        birdBrush: function (bird, spriteSheet, ctx) {
            ctx.drawImage(spriteSheet, bird.location[bird.locationIndex].x, bird.location[bird.locationIndex].y, bird.location[bird.locationIndex].w, bird.location[bird.locationIndex].h, bird.left, bird.top, bird.width, bird.height);
        },

        /*水管笔刷*/
        pipesBrush: function (pipe, spriteSheet, ctx) {
            ctx.drawImage(spriteSheet, pipe.location['downward'].x, pipe.location['downward'].y, pipe.location['downward'].w, pipe.location['downward'].h, pipe.left, pipe.topDownward, pipe.width, pipe.height);
            ctx.drawImage(spriteSheet, pipe.location['upward'].x, pipe.location['upward'].y, pipe.location['upward'].w, pipe.location['upward'].h, pipe.left, pipe.topUpward, pipe.width, pipe.height);
        },

        /*背景笔刷*/
        gameBgBrush: function (gameBg, spriteSheet, ctx) {
            ctx.drawImage(spriteSheet, gameBg.location.x, gameBg.location.y, gameBg.location.w, gameBg.location.h, gameBg.left, gameBg.top, gameBg.width, gameBg.height);
        },
    },

    /*
    * 精灵
    * 只关注自身属性，具体绘制与行为从中分离
    * 所有精灵贴图均存放于sprite_sheet.png
    * */
    SPRITE: function (spriteSheet, brush, behaviors) {
        let Sprite = function () {
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
            draw: function (ctx) {
                if (!this.death) this.brush(this, this.spriteSheet, ctx);
            },

            /*更新*/
            update: function (gameLevel, time) {
                for (let i in this.behaviors) {
                    if (this.behaviors.hasOwnProperty(i)) this.behaviors[i](this, gameLevel, time);
                }
            },
        };

        return new Sprite(spriteSheet, brush, behaviors);
    },

    /*
    * 引擎
    * */
    ENGINE: (function () {
        let Engine = function () {

            /*通用*/
            this.gameLevel = 'normal'; // 默认游戏难度
            this.paused = true; // 游戏暂停
            this.gameOver = true; // 游戏结束
            this.score = 10; // 单次得分
            this.finalScore = 0; // 得分
            this.canScore = true; // 可以得分的标志

            /*精灵*/
            this.sprites = []; // 存放所有精灵
            this.bird = {}; // 存放小鸟
            this.gameBg = {}; // 存放背景
            this.velocityYUpward = -80; // 玩家单次点击给出的向上初速度
            this.lastPipesCreated = 0; // 上一组水管被创建的时间点
            this.createPipesInterval = 2000; // 创建水管组的时间间隔
            this.firstPipesIndex = 2; // 最左边一组水管在this.sprites中的索引

            /*图片*/
            this.imagesInAsset = {}; // 存放资源中的图片名称及路径
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

            /*声音*/
            this.musicOn = true; // 背景音乐是否开启
            this.soundOn = true; // 音效是否开启

            /*事件*/
            this.currentTargetId = ''; // 存放当前触摸事件对象Id，如果touchstart与touchend事件对象不对应则不执行后续操作
            this.touchStartListeners = {}; // 存放touchstart事件监听器及处理函数
            this.touchEndListeners = {}; // 存放touchend事件监听器及处理函数

        };

        Engine.prototype = {
            constructor: Engine,

            /*
            * 游戏初始化
            * 显示loading页，资源加载动画
            * 加载完毕后隐藏loading页，显示主菜单
            * 创建游戏中所有精灵
            * */
            init: function () {
                let me = this;

                this.setter(); // 初始化数值

                this.bindTouchEvent('touchstart', this.touchStartListeners); // 开启touchstart事件

                this.bindTouchEvent('touchend', this.touchEndListeners); // 开启touchend事件

                /*图片加载*/
                this.nodes.birdFly.node.src = 'images/bird_fly.gif';
                this.nodes.birdFly.node.onload = function () {
                    me.imagesLoader(FlappyBird.ASSET.imageUrls); // 加载游戏图片资源
                    me.nodes.loadingBg.node.style.display = 'block'; // 显示loading页
                };
            },

            setter: function () {

                /*获取需要操作的节点并设置相关数值*/
                this.nodes = FlappyBird.ASSET.nodes;
                this.nodes.canvas.node.setAttribute('width', window.screen.width/* * window.devicePixelRatio */ + 'px');
                this.nodes.canvas.node.setAttribute('height', window.screen.height/* * window.devicePixelRatio*/ + 'px');
                this.context = this.nodes.canvas.node.getContext('2d'); // 绘图环境
                this.canvasWidth = this.context.canvas.width; // 获取画布宽度
                this.canvasHeight = this.context.canvas.height; // 获取画布高度

                this.SCREEN_HEIGHT_IN_METERS = 100; // 设屏幕高度为100米
                this.PIXELS_PER_METER = this.context.canvas.width / this.SCREEN_HEIGHT_IN_METERS; // 设置1米等于多少像素
                this.G = 9.8; // 重力加速度(米 / 二次方秒)
                this.G_IN_GAME = this.G * this.context.canvas.height / this.SCREEN_HEIGHT_IN_METERS; // 游戏中重力加速度(像素 / 二次方秒)

                /*获取图片*/
                this.imagesInAsset = FlappyBird.ASSET.imageUrls;

                /*存放touchstart事件所有监听器及对应的事件处理方法*/
                this.touchStartListeners = [

                    /*画布*/
                    {
                        listener: this.nodes.canvas.node,
                        handler: function (e, me) {
                            e.preventDefault();
                            e.stopPropagation();

                            me.nodes.clickSound.node.play();

                            /*给小鸟一个向上的初速度*/
                            if (!me.paused) { // 如果游戏没有停止，则可以点击
                                me.bird.t = 0;
                                me.bird.topOrigin = me.bird.top;
                                if (me.bird.top > 0) { // 如果飞太高，则不能让他过多的超出上边界
                                    me.bird.velocityY = me.velocityYUpward;
                                } else {
                                    me.bird.velocityY = 0;
                                }
                            }
                        }
                    },

                    /*主菜单*/
                    {
                        listener: this.nodes.mainMenuBox.node,
                        handler: function (e, me) {
                            e.stopPropagation();

                            if (e.target.id === me.nodes.startGame.node.id) {
                                e.target.style.backgroundPosition = '-144px 0';
                            }

                            me.currentTargetId = e.target.id;
                        }
                    },

                    /*结束菜单*/
                    {
                        listener: this.nodes.deathMenuBox.node,
                        handler: function (e, me) {
                            e.stopPropagation();

                            switch (e.target.id) {
                                case me.nodes.restartGame.node.id:
                                    e.target.style.backgroundPosition = '-144px -104px';
                                    break;
                                case me.nodes.goMainMenu.node.id:
                                    e.target.style.backgroundPosition = '-144px -52px';
                                    break;
                                case me.nodes.exitGame.node.id:
                                    e.target.style.backgroundPosition = '-144px -156px';
                                    break;
                            }
                        }
                    },

                    /*设置按钮*/
                    {
                        listener: this.nodes.setting.node,
                        handler: function (e, me) {
                            e.stopPropagation();
                            e.target.style.backgroundPosition = '-52px -398px';
                        }
                    },

                    /*设置菜单*/
                    {
                        listener: this.nodes.settingMenuBox.node,
                        handler: function (e, me) {
                            e.stopPropagation();

                            switch (e.target.id) {
                                case me.nodes.getBack.node.id:
                                    e.target.style.backgroundPosition = '-432px 0';
                                    break;
                                case me.nodes.confirm.node.id:
                                    e.target.style.backgroundPosition = '-432px -52px';
                                    break;
                            }
                        }
                    }
                ];

                /*存放touchend事件所有监听器及对应的事件处理方法*/
                this.touchEndListeners = [

                    /*主菜单*/
                    {
                        listener: this.nodes.mainMenuBox.node,
                        handler: function (e, me) {
                            e.preventDefault();
                            e.stopPropagation();

                            switch (e.target.id) {
                                case me.nodes.easyLevel.node.id:
                                case me.nodes.normalLevel.node.id:
                                case me.nodes.hardLevel.node.id:
                                    me.nodes.clickSound.node.play();
                                    me.setGameLevel(e.target, me);
                                    break;
                                case me.nodes.startGame.node.id:
                                    if (e.target.id === me.currentTargetId) {
                                        me.nodes.clickSound.node.play();
                                        me.nodes.birdFlySound.node.play();
                                        me.resetData(me);
                                        me.closeMenu(me.nodes.setting.node, me); // 隐藏设置按钮
                                        me.closeMenu(me.nodes.mainMenuBg.node, me); // 关闭主菜单
                                        me.showMenu(me.nodes.scoreBoard.node, me); // 显示计分板
                                        requestNextAnimationFrame(function (time) { // 开启循环
                                            me.animate.call(me, time);
                                        });
                                        e.target.style.backgroundPosition = '0 0';
                                    }
                                    break;
                            }
                        }
                    },

                    /*结束菜单*/
                    {
                        listener: this.nodes.deathMenuBox.node,
                        handler: function (e, me) {
                            e.preventDefault();
                            e.stopPropagation();

                            switch (e.target.id) {
                                case me.nodes.restartGame.node.id:
                                    me.nodes.clickSound.node.play();
                                    me.nodes.birdFlySound.node.play();
                                    e.target.style.backgroundPosition = '0 -104px';
                                    me.resetData(me);
                                    me.closeMenu(me.nodes.deathMenuBox.node, me); // 关闭结束菜单
                                    requestNextAnimationFrame(function (time) { // 开启循环
                                        me.animate.call(me, time);
                                    });
                                    break;
                                case me.nodes.goMainMenu.node.id:
                                    me.nodes.clickSound.node.play();
                                    e.target.style.backgroundPosition = '0 -52px';
                                    me.closeMenu(me.nodes.scoreBoard.node, me); // 关闭计分板
                                    me.closeMenu(me.nodes.deathMenuBox.node, me); // 关闭结束菜单
                                    me.showMenu(me.nodes.setting.node, me); // 显示设置按钮
                                    me.showMenu(me.nodes.mainMenuBg.node, me); // 显示主菜单
                                    break;
                                case me.nodes.exitGame.node.id:
                                    me.nodes.clickSound.node.play();
                                    e.target.style.backgroundPosition = '0 -156px';
                                    window.opener = null;
                                    window.open('', '_self');
                                    window.close();
                                    break;
                            }
                        }
                    },

                    /*设置按钮*/
                    {
                        listener: this.nodes.setting.node,
                        handler: function (e, me) {
                            e.preventDefault();
                            e.stopPropagation();

                            me.nodes.clickSound.node.play();

                            e.target.style.backgroundPosition = '0 -398px';
                            me.closeMenu(me.nodes.mainMenuBox.node, me); // 关闭主菜单，背景保留
                            me.showMenu(me.nodes.settingMenuBox.node, me); // 开启设置菜单
                        }
                    },

                    /*设置菜单*/
                    {
                        listener: this.nodes.settingMenuBox.node,
                        handler: function (e, me) {
                            e.preventDefault();
                            e.stopPropagation();

                            switch (e.target.id) {
                                case me.nodes.musicSwitch.node.id:
                                    me.nodes.clickSound.node.play();
                                    me.musicOn = !me.musicOn;
                                    if (me.musicOn) {
                                        e.target.style.backgroundPosition = '-260px -482px';
                                    } else {
                                        e.target.style.backgroundPosition = '-332px -482px';
                                    }
                                    break;
                                case me.nodes.soundSwitch.node.id:
                                    me.nodes.clickSound.node.play();
                                    me.soundOn = !me.soundOn;
                                    if (me.soundOn) {
                                        e.target.style.backgroundPosition = '-404px -482px';
                                        me.nodes.clickSound.node.muted = false;
                                    } else {
                                        e.target.style.backgroundPosition = '-476px -482px';
                                        me.nodes.clickSound.node.muted = true;
                                    }
                                    break;
                                case me.nodes.getBack.node.id:
                                    me.nodes.clickSound.node.play();
                                    e.target.style.backgroundPosition = '-288px 0';
                                    me.closeMenu(me.nodes.settingMenuBox.node, me); // 关闭设置菜单
                                    me.showMenu(me.nodes.mainMenuBox.node, me); // 显示主菜单
                                    break;
                                case me.nodes.confirm.node.id:
                                    me.nodes.clickSound.node.play();
                                    e.target.style.backgroundPosition = '-288px -52px';
                                    break;
                            }
                        }
                    }
                ];
            },

            /*
            * 游戏循环
            * */
            start: function () {

                /*创建所有精灵*/
                this.createOtherSprites();

                this.showMenu(this.nodes.mainMenuBg.node, this); // 显示主菜单

                this.setGameLevel(); // 设置游戏难度
            },
            animate: function (time) {
                let me = this;

                this.clearCanvas(); // 清除画布内容

                this.collisionDetection(); // 碰撞检测

                if (time - this.lastPipesCreated > this.createPipesInterval) {
                    this.sprites.push(this.createPipes());
                    this.lastPipesCreated = time;
                }

                if (!this.bird.death) this.updateSprites(time); // 更新精灵
                this.drawSprites(); // 绘制精灵

                /*
                * 游戏循环是否继续
                * 如果游戏没有暂停且没有结束，则继续
                * */
                if (!this.paused && !this.gameOver) {
                    requestNextAnimationFrame(function (time) {
                        me.animate.call(me, time);
                    });
                }
            },
            clearCanvas: function () {
                this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
            },
            updateSprites: function (time) {
                for (let i = 0; i < this.sprites.length; i++) {
                    if (this.sprites[i]) this.sprites[i].update(this.gameLevel, time);
                }
            },
            drawSprites: function () {
                for (let i = 0; i < this.sprites.length; i++) {
                    if (this.sprites[i]) this.sprites[i].draw(this.context);
                }
            },

            /*
            * 创建除水管外的所有精灵
            * 注意：背景要最先绘制
            * */
            createOtherSprites: function () {
                this.sprites.push(this.createGameBg());
                this.sprites.push(this.createBird());
            },
            createGameBg: function () {
                let _gameBg = FlappyBird.SPRITE(this.images['images/sprite_sheet.png'], FlappyBird.BRUSH.gameBgBrush, FlappyBird.BEHAVIOR.gameBgBehavior);

                _gameBg.width = this.canvasWidth * 2;
                _gameBg.height = this.canvasHeight;
                _gameBg.location = {x: 0, y: 0, w: 1080, h: 960};

                this.gameBg = _gameBg; // 单独存入，以便之后操作

                return _gameBg;
            },
            createBird: function () {
                let _bird = FlappyBird.SPRITE(this.images['images/sprite_sheet.png'], FlappyBird.BRUSH.birdBrush, FlappyBird.BEHAVIOR.birdBehavior);

                _bird.width = 52;
                _bird.height = 52;
                _bird.left = 70;
                _bird.top = 100;
                _bird.topOrigin = 100;
                _bird.t = 0;
                _bird.location = [{x: 0, y: 960, w: 52, h: 52}, {x: 52, y: 960, w: 52, h: 52}, {
                    x: 104,
                    y: 960,
                    w: 52,
                    h: 52
                }, {x: 156, y: 960, w: 52, h: 52}, {x: 208, y: 960, w: 52, h: 52}, {x: 260, y: 960, w: 52, h: 52}];
                _bird.lastLocation = 0; // 上一个动画帧所执行的时间节点
                _bird.G_IN_GAME = this.G_IN_GAME;
                _bird.correctWidth = 12; // 碰撞修正宽度，用于更精确计算碰撞
                _bird.correctHeight = 10; // 碰撞修正高度，用于更精确计算碰撞

                this.bird = _bird; // 单独存入，以便之后操作

                return _bird;
            },
            createPipes: function () {
                let _pipes = FlappyBird.SPRITE(this.images['images/sprite_sheet.png'], FlappyBird.BRUSH.pipesBrush, FlappyBird.BEHAVIOR.pipesBehavior);

                _pipes.width = 76;
                _pipes.height = 530;
                _pipes.left = this.canvasWidth * 3 / 2;

                _pipes.maxGap = 360; // 水管之间间距最大值
                _pipes.minGap = 140; // 水管之间间距最小值
                _pipes.gap = Math.floor(Math.random() * (_pipes.maxGap - _pipes.minGap) + _pipes.minGap); // 水管之间的间距
                _pipes.topDownward = Math.floor(Math.random() * (0 - (-_pipes.height)) + (-_pipes.height)); // 上水管top值不会大于0

                /*
                * 下水管top值等于gap高度加上上水管在屏幕可见的高度
                * 如果下水管与屏幕下边界产生间隙，则将下水管紧贴屏幕下边界
                * */
                if (_pipes.gap + _pipes.height + _pipes.topDownward + _pipes.height >= this.canvasHeight) {
                    _pipes.topUpward = _pipes.gap + _pipes.height + _pipes.topDownward;
                } else {
                    _pipes.topUpward = this.canvasHeight - _pipes.height;
                }

                _pipes.location = {
                    'downward': {x: 1080, y: 0, w: 76, h: 530},
                    'upward': {x: 1156, y: 0, w: 76, h: 530},
                };

                return _pipes;
            },

            /*
            * 碰撞检测
            * 小鸟碰到水管，小鸟飞太高，小鸟飞太低，水管移出左边界
            * */
            collisionDetection: function () {

                /*水管移出左边界*/
                if (this.sprites[this.firstPipesIndex] && this.sprites[this.firstPipesIndex].left + this.sprites[this.firstPipesIndex].width < 0) {
                    this.sprites.splice(this.firstPipesIndex, 1); // 如果水管已经移出左边界，则从allPipes中删除该组水管连同其index，不让数组长度无限制增加
                }

                /*
                * 小鸟碰到水管
                * 循环遍历this.sprites数组，索引从第一组水管开始
                * 如果撞到水管则游戏结束，显示菜单；顺利通过则游戏继续，玩家得分
                * */
                for (let i = this.firstPipesIndex; i < this.sprites.length; i++) {
                    if (this.sprites[i].left < this.bird.left + this.bird.width && this.sprites[i].left + this.sprites[i].width > this.bird.left + this.bird.correctWidth) { // 与水管在x坐标上的比较
                        if (this.sprites[i].height + this.sprites[i].topDownward > this.bird.top + this.bird.correctHeight || this.sprites[i].height + this.sprites[i].topDownward + this.sprites[i].gap < this.bird.top + this.bird.height - this.bird.correctHeight) { // 与水管在y坐标上的比较
                            this.deathAnimation() // 小鸟死亡
                        } else {
                            this.canScore = true; // 恢复可以得分标志
                        }
                    } else if (this.sprites[i].left + this.sprites[i].width <= this.bird.left) { // 小鸟通过水管
                        this.scoreHandler(); // 得分
                    }
                }

                /*小鸟飞太低*/
                if (this.bird.top > this.canvasHeight) {
                    this.deathAnimation() // 小鸟死亡
                }
            },

            /*
            * 显示菜单
            * 传入要操控的节点及this指针
            * 游戏暂停或者结束都会执行
            * */
            showMenu: function (menuNode, me) {
                let self = me;

                menuNode.style.display = 'block';

                if (menuNode.id === 'mainMenuBg') self.mainMenuBgScroll(self);
                if (menuNode.id === 'deathMenuBox') self.showFinalScore(self, self.finalScore);
            },

            /*
            * 关闭菜单
            * 传入要操控的节点及this指针
            * */
            closeMenu: function (menuNode, me) {
                let self = me;

                menuNode.style.display = 'none';
            },

            /*
            * 主菜单大背景滚动
            * */
            mainMenuBgScroll: function (me) {
                let self = me || this,
                    mainMenuBgMoveStep = 0,
                    bgScrollTimer = 0;

                /*
                * 当游戏处于暂停状态且主菜单显示时，背景按每秒60帧的速度向左移动
                * 移动距离超过一屏，则回到起点重新开始
                * */
                bgScrollTimer = setInterval(function () {
                    if (self.paused) {
                        self.nodes.mainMenuBg.node.style.backgroundPosition = mainMenuBgMoveStep-- + 'px 0px';
                        if (Math.abs(mainMenuBgMoveStep) > self.canvasWidth) mainMenuBgMoveStep = 0;
                    } else {
                        clearInterval(bgScrollTimer);
                    }
                }, 1000 / 60);
            },

            /*
            * 得分
            * 满足得分条件时执行，在游戏界面上显示当前得分
            * */
            scoreHandler: function () {
                if (this.canScore) {
                    this.finalScore += this.score;
                    this.nodes.scores.node.textContent = this.finalScore;
                    this.canScore = false;
                    if (this.finalScore >= 900) {
                        this.punishMode();
                    }
                }
            },

            /*
            * 显示最终得分
            * 在结束菜单上显示，数字对应图片
            * 每一位数字显示在单独的span标签里，有几位数字就得生成几个span标签
            * */
            showFinalScore: function (me, fScore) {
                let self = me || this,
                    fScoreString = fScore.toString();

                for (let i = 0; i < fScoreString.length; i++) {
                    let _singleScoreBox = document.createElement('span');
                    _singleScoreBox.style.display = 'inline-block';
                    _singleScoreBox.style.width = '60px';
                    _singleScoreBox.style.height = '68px';
                    _singleScoreBox.style.backgroundImage = 'url(' + self.imagesInAsset.maps + ')';
                    _singleScoreBox.style.backgroundRepeat = 'no-repeat';

                    switch (fScoreString[i]) {
                        case '0':
                            _singleScoreBox.style.backgroundPosition = '0 -1310px';
                            break;
                        case '1':
                            _singleScoreBox.style.backgroundPosition = '-60px -1310px';
                            break;
                        case '2':
                            _singleScoreBox.style.backgroundPosition = '-120px -1310px';
                            break;
                        case '3':
                            _singleScoreBox.style.backgroundPosition = '-180px -1310px';
                            break;
                        case '4':
                            _singleScoreBox.style.backgroundPosition = '-240px -1310px';
                            break;
                        case '5':
                            _singleScoreBox.style.backgroundPosition = '0 -1378px';
                            break;
                        case '6':
                            _singleScoreBox.style.backgroundPosition = '-60px -1378px';
                            break;
                        case '7':
                            _singleScoreBox.style.backgroundPosition = '-120px -1378px';
                            break;
                        case '8':
                            _singleScoreBox.style.backgroundPosition = '-180px -1378px';
                            break;
                        case '9':
                            _singleScoreBox.style.backgroundPosition = '-240px -1378px';
                            break;
                    }

                    self.nodes.finalScoreBox.node.appendChild(_singleScoreBox);
                }
            },

            /*
            * 系统制裁
            * 玩家分数超900会开启不可能完成模式
            * 单次玩家点击，小鸟会飞得更高
            * */
            punishMode: function () {
                this.velocityYUpward = -120;
            },

            /*
            * 重置游戏数据
            * 每次开始游戏以及重新开始游戏都要执行该方法
            * */
            resetData: function (me) {
                let self = me || this;

                /*
                * 通用
                * 游戏结束标志设为false，游戏暂停设为false
                * */
                self.gameOver = false;
                self.paused = false;
                self.bird.death = false;
                self.nodes.scores.node.textContent = 0;
                self.finalScore = 0;

                /*删除掉得分盒子里所有的子节点*/
                let _fScoreBox = self.nodes.finalScoreBox.node;
                for (let i = _fScoreBox.childNodes.length - 1; i >= 0; i--) {
                    _fScoreBox.removeChild(_fScoreBox.childNodes[i]);
                }

                /*
                * 小鸟
                * 小鸟死亡标志设为false，小鸟恢复原有高度
                * */
                self.bird.death = false;
                self.bird.top = 100;
                self.bird.topOrigin = 100;
                self.bird.t = 0;
                self.bird.velocityY = 0;
                self.lastLocation = 0;
                self.velocityYUpward = -80;

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
            deathAnimation: function () {
                let me = this;

                me.gameOver = true;
                me.paused = true;
                me.bird.death = true;

                me.nodes.gameOverSound.node.play();
                me.nodes.birdFlySound.node.pause();

                let deadBird = document.createElement('div');
                let deadBird_v = -140;
                let deadBird_t = 0;
                let deadBird_top = me.bird.top + 'px'; // 死亡小鸟原始top值
                let deadAnimationTimer = 0;
                deadBird.style.width = '52px';
                deadBird.style.height = '52px';
                deadBird.style.background = 'url(' + me.imagesInAsset.spriteSheet + ')';
                deadBird.style.backgroundPosition = '-312px -960px';
                deadBird.style.position = 'absolute';
                deadBird.style.top = me.bird.top + 'px';
                deadBird.style.left = me.bird.left + 'px';
                document.body.appendChild(deadBird);

                /*
                * 播放死亡动画
                * */
                setTimeout(function () {
                    deadAnimationTimer = setInterval(function () {
                        deadBird.style.top = parseInt(deadBird_top) + deadBird_v * deadBird_t + 72 * Math.pow(deadBird_t, 2) / 2 + 'px';// 根据自由落体公式统一单位后计算死亡小鸟的位置
                        deadBird_v += 1;
                        deadBird_t += 0.2;

                        if (deadBird_t <= 2) {
                            deadBird.style.backgroundPosition = '-364px -960px';
                        } else if (deadBird_t > 2) {
                            deadBird.style.backgroundPosition = '-416px -960px';
                        }

                        if (deadBird.offsetTop > me.canvasHeight) {// 小鸟飞出屏幕后，间隔一定时间显示菜单
                            document.body.removeChild(deadBird);// 删除死亡的小鸟
                            clearInterval(deadAnimationTimer);// 清除该定时器
                            setTimeout(function () {
                                me.showMenu(me.nodes.deathMenuBox.node, me);
                            }, 500);
                        }
                    }, 30);
                }, 500);
            },

            /*
            * 设置游戏难度
            * 默认为'normal'难度，如果玩家自己点击按钮更换难度，则切换该按钮的贴图
            * offsetWidth属性值必须在其父盒子没有设置display: none的情况下才能获取到
            * */
            setGameLevel: function (touchTarget, me) {
                let self = me || this,
                    _touchTarget = touchTarget || undefined;

                /*
                * 修改难度显示
                * 先还原按钮南图贴图，再修改为需要显示的难度贴图并赋值给this.gameLevel
                * */
                self.nodes.easyLevel.node.style.backgroundPosition = '0 ' + self.nodes.easyLevel.location[1] + 'px';
                self.nodes.normalLevel.node.style.backgroundPosition = '0 ' + self.nodes.normalLevel.location[1] + 'px';
                self.nodes.hardLevel.node.style.backgroundPosition = '0 ' + self.nodes.hardLevel.location[1] + 'px';
                if (_touchTarget && self.nodes.hasOwnProperty(_touchTarget.id)) {
                    _touchTarget.style.backgroundPosition = -_touchTarget.offsetWidth + 'px ' + self.nodes[_touchTarget.id].location[1] + 'px';
                    self.gameLevel = _touchTarget.getAttribute('data-level');
                    self.createPipesInterval = _touchTarget.getAttribute('data-createPipesInterval');
                } else {
                    self.nodes.normalLevel.node.style.backgroundPosition = -self.nodes.normalLevel.node.offsetWidth + 'px ' + self.nodes.normalLevel.location[1] + 'px';
                    self.gameLevel = 'normal';
                    self.createPipesInterval = 2000;
                }
            },

            /*
            * 贴图渲染
            * 传入节点对象
            * 将已加载完毕的贴图渲染到各个所需要的节点
            * */
            renderMaps: function (nodesSet) {
                let _nodesSet = nodesSet || undefined;

                if (_nodesSet) {
                    for (let singleNode in _nodesSet) {
                        if (_nodesSet.hasOwnProperty(singleNode) && _nodesSet[singleNode].render) {
                            if (_nodesSet[singleNode].node.id !== this.nodes.mainMenuBg.node.id) {
                                _nodesSet[singleNode].node.style.backgroundImage = 'url(' + this.imagesInAsset.maps + ')';
                            } else {
                                _nodesSet[singleNode].node.style.backgroundImage = 'url(' + this.imagesInAsset.bg + ')';
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
            imagesLoader: function (imageUrlsInAsset) {
                let me = this,
                    loadImagesTimer = 0,
                    loadingComplete = 0;

                /*获取资源中的所有图片路径*/
                for (let i in imageUrlsInAsset) {
                    this.imageUrls.push(imageUrlsInAsset[i]);
                }

                /*
                * 开始循环执行图片加载
                * 显示进度条及加载进度百分比
                * 如果加载进度到达100，则清除计时器，渲染游戏贴图，一段时间后关闭loading页，正式开始游戏
                * */
                loadImagesTimer = setInterval(function () {

                    /*获得当前加载进度，最高100*/
                    loadingComplete = me.loadImages();

                    if (loadingComplete === 100) {
                        clearInterval(loadImagesTimer);
                        me.renderMaps(me.nodes);
                        setTimeout(function () {
                            me.nodes.loadingBg.node.style.display = 'none';
                            me.start();
                        }, 1500);
                    }

                    me.nodes.progressBar.node.style.width = (loadingComplete / 100) * me.nodes.progressBarBox.node.offsetWidth + 'px'; // 显示进度条当前进度
                    me.nodes.loadingText.node.textContent = loadingComplete.toFixed(0) + '%'; // 显示当前进度百分比
                }, 50);
            },
            loadImages: function () {

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
            loadImage: function (imageUrl) {
                let me = this,
                    image = new Image();

                image.src = imageUrl;

                image.addEventListener('load', function () {
                    me.imagesLoaded++;
                });

                image.addEventListener('error', function () {
                    me.imagesFailed++;
                });

                /*存储图片对象及其路径*/
                this.images[imageUrl] = image;
            },

            /*
            * 时间
            * */
            updateFps: function (time) {
                this.fps = 1000 / (time - this.lastTime);
            },

            /*
            * 手指点击事件
            * 向点击事件函数传递当前this指针
            * */
            bindTouchEvent: function (eventType, listeners) {
                let me = this;

                for (let i = 0; i < listeners.length; i++) {
                    listeners[i].listener.addEventListener(eventType, function (e) {
                        listeners[i].handler(e, me);
                    });
                }
            },
        };

        return new Engine();
    })(),
};

FlappyBird.ENGINE.init();