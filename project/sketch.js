const DIFFICULTY = 5;
const MAP_SIZE = 2500;
const NUM_CATS = (MAP_SIZE / 500) * DIFFICULTY;

let cameraPos;

let player;
let cats = [];

let mouseImg, catImg;

let score = 0;

function clamp(val, mn, mx) {
    return min(max(val, mn), mx);
}

class Player {
    constructor() {
        this.pos = createVector(0, 0);
        this.vel = createVector(0, 0);
        this.moveAxis = createVector(0, 0);

        this.speed = 2.5;
        this.size = 60;
        this.friction = 0.8;

        this.lives = 3;
        this.hurtLength = 5;
        this.hurtTimer = 0;
    }

    borderCheck() {
        this.pos.x = clamp(this.pos.x, -MAP_SIZE / 2 + this.size / 2, MAP_SIZE / 2 - this.size / 2);
        this.pos.y = clamp(this.pos.y, -MAP_SIZE / 2 + this.size / 2, MAP_SIZE / 2 - this.size / 2);
    }

    onCollision() {
        this.lives--;
        this.hurtTimer = this.hurtLength;
        if (this.lives <= 0) {
            gameSetup();
        }
    }

    update() {
        this.moveAxis.set(keyIsDown(68) - keyIsDown(65), keyIsDown(83) - keyIsDown(87));
        this.moveAxis.normalize();

        this.vel.set(
            (this.vel.x + this.moveAxis.x * this.speed) * this.friction,
            (this.vel.y + this.moveAxis.y * this.speed) * this.friction
        );

        this.pos.add(this.vel);
        this.borderCheck();

        if (this.hurtTimer != 0) this.hurtTimer--;
        print(this.hurtTimer);

        cameraPos.set(this.pos);
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y);

        let angle = atan(this.vel.y / this.vel.x) + HALF_PI * 3;
        if (this.vel.x < 0) angle += PI;
        rotate(angle);

        image(mouseImg, 0, 0, this.size, this.size);
        if (this.hurtTimer != 0) {
            fill(255, 0, 0);
            circle(0, 0, this.size);
        }

        pop();
    }

    ui() {
        if (this.hurtTimer != 0) fill(255, 0, 0);
        else fill(255);
        text(str(this.lives), 150, 150);
    }
}

class Cat {
    constructor() {
        let d = random(500, MAP_SIZE / 2);
        let a = random(0, TWO_PI);

        this.pos = createVector(cos(a) * d, sin(a) * d);
        this.vel = createVector(0, 0);
        this.dir = createVector(0, 0);

        this.currentTarget = createVector(random(-MAP_SIZE / 2, MAP_SIZE / 2), random(-MAP_SIZE / 2, MAP_SIZE / 2));
        this.touchingPlayer = false;

        this.speed = 5;
        this.size = 120;
    }

    pickTarget() {
        if (random(0, 1) < 0.6) {
            this.currentTarget.set(player.pos);
        } else {
            this.currentTarget.set(random(-MAP_SIZE / 2, MAP_SIZE / 2), random(-MAP_SIZE / 2, MAP_SIZE / 2));
        }
    }

    update() {
        this.dir = p5.Vector.sub(this.currentTarget, this.pos);
        if (abs(this.dir.x) < this.speed && abs(this.dir.y) < this.speed) this.pickTarget();
        this.dir.normalize();

        this.vel.set(this.dir.x * this.speed, this.dir.y * this.speed);
        this.pos.add(this.vel);

        this.speed *= 1.0001;

        let distToPLayer = sqrt(sq(this.pos.x - player.pos.x) + sq(this.pos.y - player.pos.y));
        if (distToPLayer <= this.size / 2 + player.size / 2) {
            if (!this.touchingPlayer) {
                player.onCollision();
                this.touchingPlayer = true;
            }
        } else if (this.touchingPlayer) {
            this.touchingPlayer = false;
        }
    }

    display() {
        let v = p5.Vector.sub(this.pos, cameraPos);
        if (abs(v.x) <= width && abs(v.x) > 0 && abs(v.y) <= height && abs(v.y) > 0) {
            // line(this.pos.x, this.pos.y, this.currentTarget.x, this.currentTarget.y);
            push();
            translate(this.pos.x, this.pos.y);
            image(catImg, 0, 0, this.size, this.size);
            pop();
        }
    }
}

function preload() {
    mouseImg = loadImage("mouse.png");
    catImg = loadImage("cat.png");
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    cameraPos = createVector(0, 0);

    textSize(40);
    textAlign(CENTER, CENTER);

    imageMode(CENTER);

    gameSetup();
}

function gameSetup() {
    player = new Player();
    cats = [];
    for (let i = 0; i < NUM_CATS; i++) cats.push(new Cat());

    score = 0;
}

function draw() {
    background(0);

    // if (score === 0) tint(255, 0, 0);

    score += 0.01 * DIFFICULTY;

    player.update();
    for (let i = 0; i < NUM_CATS; i++) cats[i].update();

    push();
    translate(width / 2 - cameraPos.x, height / 2 - cameraPos.y);

    fill(175, 131, 49);
    rect(-MAP_SIZE / 2, -MAP_SIZE / 2, MAP_SIZE, MAP_SIZE);

    for (let i = 0; i < NUM_CATS; i++) cats[i].display();
    player.display();

    pop();

    text(str(score.toFixed(2)), 300, 150);
    player.ui();
}

function keyPressed() {
    if (keyCode == ESCAPE && !isLooping()) {
        loop();
    } else if (keyCode == ESCAPE && isLooping()) {
        noLoop();
    }
}
