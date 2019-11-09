var suits = ["spade","daimond","club","heart"], 
	points = ["A",2,3,4,5,6,7,8,9,10,"J","Q","K"], 
	cardNames = ["杀","闪","桃","过河拆桥"], 
	player1 = $("#player1"),
	player2 = $("#player2");

// 返回0-maxnum的一个伪随机整数
function newRandom (maxnum){
	return Math.floor(Math.random()*(maxnum + 1))
}

// 卡牌
class Card {
	constructor(name,suit,point) {
			this.owner=null;
			this.object=null;
			this.name=name;
			this.suit=suit;
			this.point=point;
			this.cardButton=$("<button></button>")
				.attr("type","button")
				.text(this.name+" "+this.suit+this.point)
	}
	//description:"fixed","chosen",optional"
	showCard(description){
		switch (description) {
			case "fixed":
				this.cardButton.css("background-color","gray")
				break;
			case "chosen":
				this.cardButton.css("background-color","black")
				break;
			case "optional":
				this.cardButton.css("background-color","white")
				break;
			default:
				throw new Error("card description is "+description)
		}
		return this.cardButton
	}
}


// 手牌
class Hand extends Array{
	constructor(person) {
		super();
		this.owner = person
	}

	// 把button添加到html中
	showCards(){
		this.map(function(current){
			$("#" + this.player + "Hand")
				.append(current.showCard("fixed").click(
					()=>{$("#"+this.player+"Tips").html("<p>这不是你的回合！</p>")}
				))
		},this.owner)
	}
}

// 随机牌库
class Library extends Array{
	constructor(num) {
		super();
		for(let i = 0;i < num;i++){
			this.push(new Card(
				cardNames[newRandom(3)],
				suits[newRandom(3)],
				points[newRandom(12)]
			))
		}
	}
}

// 玩家
class Person {
	constructor(player,nation,sex,name,hp,skill) {
		this.player = player;
		this.body = {
			nation:nation,
			sex:sex,
			name:name,
			maxHp:hp,
			hp:hp,
		};
		this.skill=skill;
		this.hand = new Hand(this)
	}
	showBody(){
		$("#"+this.player+"Body").text(JSON.stringify(this.body));
	}
	health(){
		if(this.body.maxHp===this.body.hp){
			return "full"
		}else if(this.body.hp >= 0){
			return "notfull"
		}else if(this.body.hp < 0)
			return "dying"
	}
	minusHp(num){
		this.body.hp--;
		this.showBody();
		while(this.health()==="dying"){
			if(this.hand.checkCard("桃")){
				//异步处理


			}
			this.lose();
		}
	}
	draw2Hand(num,library){
		for(let i = 0;i < num;i++){
			library[0].owner = this;
			this.hand.push(library[0]);
			library.shift();
		}
		this.hand.showCards();
	}
	checkCard(cardName){
		if(this.hand.some(function(card){return card.name===cardName})){
			this.hand.map(function(card){
				if(card.name===cardName){
					card.showCard("optional")
				}
			})
			return true
		}
	}	
	removeHand(card){
		if(card === 'random'){
			card = this.hand.splice(newRandom(this.hand.length-1),1)
		}
		//清除card上的subject,object标识
		card.owner = card.object = null;
		this.hand.splice(this.hand.indexOf(card),1).showCards()
	}
	lose(){
		alert(this.player+'输了，游戏结束！');
		// 游戏结束，数据清理

		
	}
}	


function playStart(){
	// 初始化对局
	var order = 1;
	var player1 = new Person("player1","Qun","male","LvBu",4,null);
	var player2 = new Person("player2","Qun","female","Diaochan",3,null);
	var library = new Library(50);
	[player1,player2].forEach(function(current){
		current.showBody();
		current.draw2Hand(4,library);
	})
	
	
	// // 使用闭包把回合封装起来
	function round() {
		var subject, object;
		
		// 判别回合的主宾
		order%2 === 1 ? [subject,object] = [player1,player2] : [player2,player1];
		$("#"+subject.player+"Tips").text("你的回合");
		$("#"+subject.player).append($('<button type="button" id="finish">结束回合</button>'));
		$("#finish").click(finish);
		
		// 摸牌
		if(order === 1){
			subject.draw2Hand(1,library)
		}else{
			subject.draw2Hand(2,library)
		}
		
	// 	// 打牌
		var shaNum = 0;
		subject.hand.forEach(function(card){
			if(!(card.name==="闪"
				||(card.name==="桃"&&subject.health()==="full")
				||(card.name==="过河拆桥"&&object.hand.length===0)))
				card.showCard("optional");
			card.cardButton.click(() => {
				switch (card.name) {
					case "杀":
						if(shaNum){
							$("#"+subject.player+"Tips").text("你已经出过杀了！")
						}else{
							shaNum++;
							object.shaTarget = true;
							if(object.checkCard("闪")){
								// 异步处理
							}
							if(object.shaTarget){
								object.minusHp(1);
							}
						}		
						break;
					case "桃":
						if(object.health()==="notfull"){
							object.body.hp++;
						}
						break;
					case "过河拆桥":
						if(object.hand.length===0){
							$("#"+subject.player+"Tips").text("对方已经没有牌了！")
						}
					default:
						break;
				}
				subject.removeHand(this);
			})
		})
		object.hand.forEach(function(card){
			card.cardButton.click(() => {
				switch (card.name) {
					case "闪":
						if(object.shaTarget){
							object.shaTarget = true;
						}
						break;
					case "桃":
						if(object.health()==="dying"){
							object.body.hp++;
						}
						break;
					default:
						break;
				}
			})
		})
		
		//弃牌
		if(subject.hand.length > subject.body.hp){
			for(let i = 0;i < (subject.hand.length - subject.body.hp);i++){
				subject.removeHand("random")
			}
		}
		
		// 准备下一回合
		function finish(){
			if(subject.hand.length > subject.body.hp){
				for(let i = 0;i < (subject.hand.length - subject.body.hp);i++){
					subject.removeHand("random")
				}
			}
			$("#"+subject.player+"Tips").text("对手的回合");
			order++;			
		}

	}
	return round
}

// 游戏开始
function gameStart () {
	$("#start").hide();
	$("#mainpage").show();
	// 测试playStart函数
	playStart();
	var round = playStart()
	round();
	// while(1){
	// 	round()
	// }
}

// 重新游戏
function gameRestart(){
	// 清除当前所有数据***
	$("#mainpage").hide();
	$("#start").show();	
}
//结束对局
function gameEnd () {
	window.close();
}























