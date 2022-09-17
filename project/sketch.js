const MAP_SIZE = 1000;
const NUM_CATS = 1; //MAP_SIZE / 50;

class Player {
    constructor() {
        this.xPos = 0;
        this.yPos = 0;

        this.xVel = 0;
        this.yVel = 0;

        this.speed = 3;
        this.friction = 0.75;

        this.size = 60;
        this.img = loadImage("mouse.png");

        this.lives = 3;
    }

    borderCheck() {
        if (this.xPos + this.size / 2 >= MAP_SIZE) this.xPos = min(MAP_SIZE - this.size / 2, this.xPos);
        else if (this.xPos - this.size / 2 <= -MAP_SIZE) this.xPos = max(-MAP_SIZE + this.size / 2, this.xPos);
        if (this.yPos + this.size / 2 >= MAP_SIZE) this.yPos = min(MAP_SIZE - this.size / 2, this.yPos);
        else if (this.yPos - this.size / 2 <= -MAP_SIZE) this.yPos = max(-MAP_SIZE + this.size / 2, this.yPos);
    }

    eat() {
        this.lives--;
        if (this.lives <= 0) {
            player = null;
        }
    }

    update() {
        let xMoveAxis = keyIsDown(68) - keyIsDown(65);
        let yMoveAxis = keyIsDown(83) - keyIsDown(87);

        let hyp = sqrt(sq(xMoveAxis) + sq(yMoveAxis));
        if (hyp != 0) {
            xMoveAxis /= hyp;
            yMoveAxis /= hyp;
        }

        this.xVel = (this.xVel + xMoveAxis * this.speed) * this.friction;
        this.yVel = (this.yVel + yMoveAxis * this.speed) * this.friction;

        this.xPos += this.xVel;
        this.yPos += this.yVel;

        this.borderCheck();

        translate(width / 2 - this.xPos, height / 2 - this.yPos);
    }

    display() {
        translate(this.xPos, this.yPos);

        push();

        let angle = atan(this.yVel / this.xVel) + HALF_PI * 3;
        if (this.xVel < 0) angle += PI;
        rotate(angle);

        image(this.img, 0, 0, this.size, this.size);

        // fill(100);
        // circle(0, 0, this.size);

        pop();
    }

    ui() {
        fill(0);
        text(str(this.lives), 100, 100);
    }
}

class Cat {
    constructor() {
        this.xPos = random(-MAP_SIZE, MAP_SIZE);
        this.yPos = random(-MAP_SIZE, MAP_SIZE);

        this.speed = 4;

        this.currentTargetX = random(-MAP_SIZE, MAP_SIZE);
        this.currentTargetY = random(-MAP_SIZE, MAP_SIZE);

        this.size = 120;
        this.img = loadImage("cat.png");
    }

    pickTarget() {
        if (random(0, 1) < 0.5) {
            this.currentTargetX = player.xPos;
            this.currentTargetY = player.yPos;
        } else {
            this.currentTargetX = random(this.xPos - MAP_SIZE / 2, this.xPos + MAP_SIZE / 2);
            this.currentTargetY = random(this.yPos - MAP_SIZE / 2, this.yPos + MAP_SIZE / 2);
        }
    }

    update() {
        let x = this.currentTargetX - this.xPos;
        let y = this.currentTargetY - this.yPos;

        if (abs(x) < 2 && abs(y) < 2) {
            this.pickTarget();
        }

        let hyp = sqrt(sq(x) + sq(y));
        if (hyp != 0) {
            x /= hyp;
            y /= hyp;
        }

        this.xPos += x * this.speed;
        this.yPos += y * this.speed;

        if (abs(player.xPos - this.xPos) < player.size + this.size) {
            if (abs(player.xPos - this.xPos) < player.size + this.size) {
                let distance = sqrt(sq(player.xPos - this.xPos) + sq(player.yPos - this.yPos));
                if (distance < player.size + this.size) {
                    // player.eat();
                    print("OH NOOOOO!");
                }
            }
        }
    }

    display() {
        // if (this.xPos > 0 && this.xPos < width && this.yPos > 0 && this.yPos < height) {
        image(this.img, this.xPos, this.yPos, this.size, this.size);
        // fill(0);
        // circle(this.xPos, this.yPos, this.size);
        // }
    }
}

let player;
let cats = [];
let time = 0;

function setup() {
    createCanvas(600, 600);

    textSize(30);
    textAlign(CENTER, CENTER);

    imageMode(CENTER);

    player = new Player();
    for (let i = 0; i < NUM_CATS; i++) cats.push(new Cat());
}

function draw() {
    background(0);

    text(str(cats.length), 200, 200);

    time++;
    // if (time % 1000) cats.push(new Cat());

    push();

    player.update();
    for (let i = 0; i < NUM_CATS; i++) cats[i].update();

    fill(175, 131, 49);
    rect(-MAP_SIZE, -MAP_SIZE, MAP_SIZE * 2, MAP_SIZE * 2);

    for (let i = 0; i < NUM_CATS; i++) cats[i].display();
    player.display();

    pop();

    player.ui();
}
