if(typeof Array.isArray === "undefined"){
	Array.isArray = function(arg){
		return Object.prototype.toString.call(arg) === "[object Array]";
	};
}



$(function(){

var g = {
	paper: null,
	breaker: null,
	blocks: {},
	ball: null,
	breakerWidth: null,
	breakerHeight: null,
	speed: 64, //1~1000
	blockWidth: null,
	blockHeight: null,
	ballInfo: {
		// 当前坐标
		x: null,
		y: null,
		// 下一个点坐标
		nextX: null,
		nextY: null,
		// 运行方向
		dirX: null,
		dirY: null,
		speed: 10,
		// 半径
		radius: null
	},
	started: null,
	breakerItvId: null,
	ballItvId: null,
	map: [[]],

	init: function(ele){
		g.tar = ele;
		g.paper = new Raphael(g.tar);
		g.resize();
		g.initBreaker();
		g.initBall();
		g.started = false;
	},

	loadMap: function(str){
		// if(Array.isArray(str)) return;
		var t = str.split(/\r?\n/);
		for(var i=0; i<t.length; i++){
			t[i] = t[i].split('');
		/*	for(var j=0; j<t[i].length; j++){
				if(t[i][j] === '.'){
					t[i][j] = false;
				}else{
					t[i][j] = true;
				}
			}*/
		}
		g.map = t;
		g.renderMap();
	},

	renderMap: function(){
		g.blocks = {};
		for(var i=0; i<g.map.length; i++){
			for(var j=0; j<g.map[i].length; j++){
				if(g.map[i][j]==='.') continue;
				var rect = g.paper.rect(j*g.blockClientWidth+g.paper.width/20+(g.blockClientWidth-g.blockWidth)/2, i*g.blockClientHeight+g.paper.height/12+(g.blockClientHeight-g.blockHeight)/2, g.blockWidth, g.blockHeight);
				rect.attr({
					'stroke-width': 1.5
				});
				g.blocks[rect.id] = rect;
			}
		}
	},

	resize: function(width, height){
		var ctn = $(g.paper.canvas).parent();
		width = width || ctn.width();
		height = height || ctn.height();
		g.breakerWidth = g.paper.width/4;
		g.breakerHeight = g.paper.height/36;
		g.blockClientWidth = g.paper.width/20;
		g.blockWidth = g.paper.width/25;
		g.blockClientHeight = g.paper.height*5/9/9;
		g.blockHeight = g.paper.height*4/9/9;
		g.ballInfo.radius = g.paper.height/72;
		g.ballInfo.speed = Math.sqrt(Math.pow(g.paper.width,2) + Math.pow(g.paper.height,2))/100
	},
	initBreaker: function(){
		g.breaker = g.paper.rect((g.paper.width-g.breakerWidth)/2, g.paper.height*8/9, g.breakerWidth, g.breakerHeight, 2);
		
		g.breaker.attr({
			'stroke-width': 2
		});
		g.listenKeyboard();
	},
	initBall: function(){
		g.ball = g.paper.circle(g.paper.width/2, g.paper.height*8/9-g.ballInfo.radius, g.ballInfo.radius);
		g.ballInfo.x = g.paper.width/2;
		g.ballInfo.y = g.paper.height*8/9-g.ballInfo.radius;
		g.ball.attr({
			'stroke-width': 2
		});
	},
	breakerMoveLeft: function(length){
		var x = g.breaker.attrs.x - length;
		if(g.breaker.attrs.x-length<g.paper.width/20){
			x = g.paper.width/20;
			return false;
		}
		g.breaker.attr({
			x: x
		});
		return true;
	},
	breakerMoveRight: function(length){
		var x = g.breaker.attrs.x + length;
		if(g.breaker.attrs.x+length+g.breakerWidth>g.paper.width*19/20){
			x = g.paper.width*19/20 - g.breakerWidth;
			return false;
		}
		g.breaker.attr({
			x: x
		});
		return true;
	},
	listenKeyboard: function(){
		var keyLeftDowned = false;
		var keyRightDowned = false;
		$(document).off('keydown').on('keydown', function(e){
			if(!g.started) return;
			if(e.which === 37 && !keyLeftDowned){
				keyLeftDowned = true;
				var moveLength = 2;
				clearInterval(g.breakerItvid);
				g.breakerItvid = setInterval(function(){
					g.breakerMoveLeft(moveLength+=g.paper.width/1600);
				}, 1000/g.speed);
			}else if(e.which === 39 && !keyRightDowned){
				keyRightDowned = true;
				var moveLength = 2;
				clearInterval(g.breakerItvid);
				g.breakerItvid = setInterval(function(){
					g.breakerMoveRight(moveLength+=g.paper.width/1600);
				}, 1000/g.speed);
			}
		})
		$(document).off('keyup')
		.on('keyup', function(e){
			if(!g.started) return;
			if(e.which === 37){
				keyLeftDowned = false;
				if(!keyRightDowned){
					clearInterval(g.breakerItvid);
				}
			}else if(e.which === 39){
				keyRightDowned = false;
				if(!keyLeftDowned){
					clearInterval(g.breakerItvid);
				}
			}
		})

		$(document).off('keypress')
		.on('keypress', function(e){
			if(e.which === 32){
				if(!g.started){
					g.start();
					g.started = true;
				}
			}
		});
	},
	start: function(){
		/* 开局方向随机且保证方向不会太低 */
		g.ballInfo.dirX = parseInt(Math.random()*1000)%(g.ballInfo.speed*Math.sqrt(2)+1)-g.ballInfo.speed*Math.sqrt(2)/2;
		g.ballInfo.dirY = -Math.sqrt(Math.pow(g.ballInfo.speed, 2)-Math.pow(Math.abs(g.ballInfo.dirX), 2));
	/*	g.ballInfo.dirX = -4.7;
		g.ballInfo.dirY = -5;*/
		g.ballItvId = setInterval(function(){
			g.ballInfo.nextX = g.ballInfo.x + g.ballInfo.dirX;
			g.ballInfo.nextY = g.ballInfo.y + g.ballInfo.dirY;
			if(g.collisionDetection()){
				if(Object.keys(g.blocks).length === 0){
					clearInterval(g.ballItvId);
					clearInterval(g.breakerItvid);
					alert('You Win!');
				}
				g.ball.attr({
					cx: g.ballInfo.x,
					cy: g.ballInfo.y,
				});
			}else{
				// TODO
				clearInterval(g.ballItvId);
				clearInterval(g.breakerItvid);
				alert('Game Over!');
				g.init(g.tar);
				g.resize();
				// g.loadMap(g.map);
				g.renderMap();
			}
			// console.log(g.ballInfo.x+','+g.ballInfo.y);
		}, 1000/g.speed);
	},
	collisionDetection: function(){
		// 碰撞检测
		// 左边墙
		if(g.ballInfo.nextX - g.ballInfo.radius <= g.paper.width/20){
			g.ballInfo.nextX = g.paper.width/20 + g.ballInfo.radius;
			g.ballInfo.dirX = -g.ballInfo.dirX;
		}else
		//右边墙
		if(g.ballInfo.nextX + g.ballInfo.radius >= g.paper.width*19/20){
			g.ballInfo.nextX = g.paper.width*19/20 - g.ballInfo.radius;
			g.ballInfo.dirX = -g.ballInfo.dirX;
		}
		// 上边墙
		if(g.ballInfo.nextY - g.ballInfo.radius <= g.paper.height/12){
			g.ballInfo.nextY = g.paper.height/12 + g.ballInfo.radius;
			g.ballInfo.dirY = -g.ballInfo.dirY;
		}

		// 下边墙
		if(g.ballInfo.nextY - g.ballInfo.radius >= g.paper.height*11/12){
			// 反弹
			// g.ballInfo.nextY = g.paper.height*11/12 - g.ballInfo.radius;
			// g.ballInfo.dirY = -g.ballInfo.dirY;

			// 结束
			return false;
		}

		// 打到breaker上
		g.collisionDetectionBallAndRect(g.breaker);

		// 打到block上
		for(var key in g.blocks){
			if(g.collisionDetectionBallAndRect(g.blocks[key])){
				g.blocks[key].remove();
				delete g.blocks[key];
			}
		}

		g.ballInfo.x = g.ballInfo.nextX;
		g.ballInfo.y = g.ballInfo.nextY;

		return true;
	},
	collisionDetectionBallAndRect: function(rect){
		var cx = g.ballInfo.nextX;
		var cy = g.ballInfo.nextY;
		var r = g.ballInfo.radius;
		var rx = rect.attrs.x;
		var ry = rect.attrs.y;
		var w = rect.attrs.width;
		var h = rect.attrs.height;

		var ret = false;
		// 上碰撞
		if(cy+r>=ry && cy-r<=ry && cx>=rx && cx<=rx+w){
			g.ballInfo.nextY = ry - r;
			g.ballInfo.dirY = -g.ballInfo.dirY;
			ret = true;
		}
		// 下碰撞
		else if(cy-r<=ry+h && cy+r>=ry+h && cx>=rx && cx<=rx+w){
			g.ballInfo.nextY = ry + h + r;
			g.ballInfo.dirY = -g.ballInfo.dirY;
			ret = true;
		}
		// 左碰撞
		else if(cx+r>=rx && cx-r<=rx && cy>=ry && cy<=ry+h){
			g.ballInfo.nextX = rx - r
			g.ballInfo.dirX = -g.ballInfo.dirX;
			ret = true;
		}
		// 右碰撞
		else if(cx-r<=rx+w && cx+r>=rx+w && cy>=ry && cy<=ry+h){
			g.ballInfo.nextX = rx + w + r;
			g.ballInfo.dirX = -g.ballInfo.dirX;
			ret = true;
		}
		// 角部分
		// TODO
		// 左上角
		else if(Math.pow(Math.abs(cx-rx),2) + Math.pow(Math.abs(cy-ry),2) <= Math.pow(r,2)){
			// 向左上随机弹
			g.ballInfo.dirX = - Math.random()*g.ballInfo.speed;
			g.ballInfo.dirY = - Math.sqrt(Math.pow(g.ballInfo.speed, 2) - Math.pow(g.ballInfo.dirX, 2));
			g.ballInfo.nextX = cx + g.ballInfo.dirX;
			g.ballInfo.nextY = cy + g.ballInfo.dirY;
			ret = true;
		}else
		// 右上角
		if(Math.pow(Math.abs(cx-(rx+w)),2) + Math.pow(Math.abs(cy-ry),2) <= Math.pow(r,2)){
			g.ballInfo.dirX = Math.random()*g.ballInfo.speed;
			g.ballInfo.dirY = - Math.sqrt(Math.pow(g.ballInfo.speed, 2) - Math.pow(g.ballInfo.dirX, 2));
			g.ballInfo.nextX = cx + g.ballInfo.dirX;
			g.ballInfo.nextY = cy + g.ballInfo.dirY;
			ret = true;
		}else
		// 左下角
		if(Math.pow(Math.abs(cx-rx),2) + Math.pow(Math.abs(cy-(ry+h),2)) <= Math.pow(r,2)){
			g.ballInfo.dirX = - Math.random()*g.ballInfo.speed;
			g.ballInfo.dirY = Math.sqrt(Math.pow(g.ballInfo.speed, 2) - Math.pow(g.ballInfo.dirX, 2));
			g.ballInfo.nextX = cx + g.ballInfo.dirX;
			g.ballInfo.nextY = cy + g.ballInfo.dirY;
			ret = true;
		}else
		// 右下角
		if(Math.pow(Math.abs(cx-(rx+w)),2) + Math.pow(Math.abs(cy-(ry+h)),2) <= Math.pow(r,2)){
			g.ballInfo.dirX = Math.random()*g.ballInfo.speed;
			g.ballInfo.dirY = Math.sqrt(Math.pow(g.ballInfo.speed, 2) - Math.pow(g.ballInfo.dirX, 2));
			g.ballInfo.nextX = cx + g.ballInfo.dirX;
			g.ballInfo.nextY = cy + g.ballInfo.dirY;
			ret = true;
		}
		return ret;
	}
};



$('#g-tar').width(400)
$('#g-tar').height(360);
g.init($('#g-tar')[0]);
var map = 
'..##...###...###..\n' +
'.###..#...#.#...#.\n' +
'..##.....#...###..\n' +
'..##....#.......#.\n' +
'..##...#....#...#\n' +
'.####.#####..###.';

/*var map = 
'##################\n' +
'##################\n' +
'##################\n' +
'##################\n' +
'##################\n' +
'##################';
*/
g.loadMap(map);




});
