"use strict";

/**
 * canvas原点在左下角，设垂直向下为正方向
 */

var SPEED = 40;  //滚屏速度
var GAP = 180;  //水管上下间距
var G = 10;  //重力加速度
var V = -40;  //单次点击给出的速度(可叠加)

//--------------------------------------小鸟，水管构造函数
var map = document.getElementById("map");  //获取画布
var ctx = map.getContext('2d');  //获取绘图环境
var scoreNum = document.getElementById("score");  //获取分数
var scoreBox = document.getElementById("scoreBox");  //获取分数盒子
var trees = document.getElementsByClassName("tree");  //获取树
var winSize = [document.documentElement.clientWidth, document.documentElement.clientHeight];  //窗口宽高
var pipes = [];  //水管组
var isOver = false;  //游戏是否结束
var score = 0;  //游戏得分
var v = 0;  //初速度
var t = 0;  //时间
var bh = 0;  //小鸟上抛高度
var _bh = 0;  //小鸟高度暂存，为了擦除并重绘
var bh_origin = -500;  //小鸟当前初始高度
var isScore = false;  //小鸟是否可以加分

window.onresize = function () {
    winSize = [document.documentElement.clientWidth, document.documentElement.clientHeight];
};

//-------------------设置画布长宽
map.setAttribute("width", winSize[0] + "px");
map.setAttribute("height", winSize[1] + "px");
ctx.translate(0, winSize[1]);

/**
 * 小鸟构造函数
 * @constructor
 */
function Bird() {
    this.color = "#fff9b5";
    this.bird_x = 200;
}

/**
 * 绘制小鸟
 */
Bird.prototype.createBird = function (bh) {
    ctx.beginPath();
    ctx.clearRect(this.bird_x, _bh, 40, 40);
    ctx.rect(this.bird_x, bh, 40, 40);
    _bh = bh;
    ctx.fillStyle = "#fff9b5";
    ctx.fill();
    ctx.closePath();
};

var bird = new Bird();  //实例化小鸟

/**
 * 一组水管(上下两个)构造函数
 * @constructor
 */
function Pipe() {
    this.getH = function () {  //获取水管高度
        return Math.floor(Math.random() * (winSize[1] - GAP * 2) + GAP);
    };
    this.getW = function () {  //获取水管宽度
        return Math.floor(Math.random() * 160 + 100);
    };
    this.width = this.getW();
    this.height_1 = this.getH();
    this.height_2 = winSize[1] - this.height_1 - GAP;
}

/**
 * 绘制上下两个水管
 * @param pos
 */
Pipe.prototype.createPipes = function (pos) {
    ctx.beginPath();
    ctx.clearRect(pos + 10, -winSize[1], this.width, this.height_1);
    ctx.clearRect(pos + 10, -this.height_2, this.width, this.height_2);
    ctx.rect(pos, -winSize[1], this.width, this.height_1);
    ctx.rect(pos, -this.height_2, this.width, this.height_2);
    ctx.fillStyle = "#4f5c66";
    ctx.fill();
    ctx.closePath();
};

//--------------------------------------小鸟，水管，树运动
/**
 * 显示面板
 */
function showBoard() {
    var info = document.getElementById("info");
    var go = document.getElementById("go");
    var board = document.getElementById("board");
    info.innerHTML = "<strong style='font-size: 40px; line-height: 120px;'>游戏结束</strong><br/><strong>得分：&nbsp;&nbsp;</strong><strong style='font-size: 60px; color: #fff9b5; vertical-align:-5px;'>" + score + "</strong>";
    go.textContent = "再玩一次";
    board.style.display = "block";
    scoreBox.style.display = "none";
    clearInterval(birdTimer);
    clearInterval(createPipeTimer);
    clearInterval(movePipeTimer);
    ctx.clearRect(0, 0, map.offsetWidth, -map.offsetHeight);  //清屏
    isOver = false;
}

var birdTimer = setInterval(function () {  //小鸟定时器
    birdDrop(t);
    treeSwitch();
}, 20);

var createPipeTimer = setInterval(function () {  //绘制水管定时器
    pipes[pipes.length] = new Pipe();  //每隔一段时间实例化一组水管
    pipes[pipes.length - 1].pipe_x = winSize[0];
    pipes[pipes.length - 1].createPipes(pipes[pipes.length - 1].pipe_x);  //使用水管createPipes方法进行具体绘制
}, 2000);

var movePipeTimer = setInterval(function () {  //移动水管定时器
    for (var x = 0; x < pipes.length; x++) {
        pipes[x].pipe_x -= 10;
        pipes[x].createPipes(pipes[x].pipe_x);

        //-------------------如果水管超出左边界则将其放到数组最后一项并定位
        if (pipes[0].pipe_x + pipes[0].width <= 0) {
            pipes.splice(0, 1);
            pipes[pipes.length] = new Pipe();
            if (pipes[pipes.length - 2].pipe_x + pipes[pipes.length - 2].width >= winSize[0]) {
                pipes[pipes.length - 1].pipe_x = pipes[pipes.length - 2].pipe_x + pipes[pipes.length - 2].width + 300;
            } else {
                pipes[pipes.length - 1].pipe_x = winSize[0] + 300;
            }
            pipes[pipes.length - 1].createPipes(pipes[pipes.length - 1].pipe_x);
            clearInterval(createPipeTimer);
        } else if (pipes[0] === undefined) {  //如果运动过快导致pipe[0]不存在，则直接在屏幕右侧绘制
            pipes[0] = new Pipe();
            pipes[0].pipe_x = winSize[0];
            pipes[0].createPipes(pipes[0].pipe_x);
        }
    }
}, SPEED);

/**
 * 小鸟上抛运动
 */
function birdDrop() {
    bh = Math.round(bh_origin + v * t + G * Math.pow(t, 2) / 2);
    bird.createBird(bh);

    //-------------------碰撞检测
    for (var i = 0; i < pipes.length; i++) {  //当小鸟撞到水管时
        if (pipes[i].pipe_x <= bird.bird_x + 40 && pipes[i].pipe_x + pipes[i].width > bird.bird_x) {
            if (-winSize[1] + pipes[i].height_1 >= bh || -pipes[i].height_2 <= bh + 40) {
                showBoard();
                isOver = true;
            } else {
                isScore = true;
            }
        } else if (pipes[i].pipe_x + pipes[i].width <= bird.bird_x) {
            if (isScore) {
                score += 10;
                scoreNum.textContent = score;
                isScore = false;
            }
        }
    }

    if (Math.floor(bh) > 0) {  //当小鸟落地时
        showBoard();
        isOver = true;
    }
    if (Math.abs(bh) >= winSize[1]) {  //当小鸟飞太高时
        bh = -winSize[1];
    }

    t = t + 0.2;
}

/**
 * 树运动
 */
function treeSwitch() {
    trees[0].style.left = trees[0].offsetLeft - 3 + 'px';
    trees[1].style.left = trees[1].offsetLeft - 3 + 'px';

    if (trees[0].offsetLeft <= -winSize[0]) {
        trees[0].style.left = winSize[0] + 'px';
    }
    if (trees[1].offsetLeft <= -winSize[0]) {
        trees[1].style.left = winSize[0] + 'px';
    }
}


//--------------------------------------绑定鼠标左键事件
document.onclick = function () {
    v = V;
    t = 0;
    bh_origin = bh;
    bh = 0;
};