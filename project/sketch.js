// Konstanter for sværhedsgrad, størrelse af banen og nummer af katte
const DIFFICULTY = 3;
const MAP_SIZE = 2500;
const NUM_CATS = (MAP_SIZE / 500) * DIFFICULTY;

// Vektor for kameraets position
let cameraPos;

// Variabel for spiller og en liste af katte
let player;
let cats = [];

// Billedet for katten og musen
let mouseImg, catImg;

// Score til at måle hvor godt man klarer sig
let score = 0;
let highscore = 0;

// Funktion returnerer 'val' imellem ['mn', 'mx']
function clamp(val, mn, mx) {
    return min(max(val, mn), mx);
}

// Spiller-klasse
class Player {
    constructor() {
        // Position- og hastighedvektor for spiller
        this.pos = createVector(0, 0);
        this.vel = createVector(0, 0);
        // Vektor for w, a, s, og d
        this.moveAxis = createVector(0, 0);

        // Hastighed og størrelse
        this.speed = 2.5;
        this.size = 60;
        // Bestemmer hvor hurtigt spilleres hastighed falder
        this.friction = 0.8;

        // Antal liv
        this.lives = 3;
        // Længde af skade-stadie i frames efter spilleren har taget skade
        this.hurtLength = 8;
        this.hurtTimer = 0;
    }

    // Sørger for at positionen er inde for banen
    borderCheck() {
        this.pos.x = clamp(this.pos.x, -MAP_SIZE / 2 + this.size / 2, MAP_SIZE / 2 - this.size / 2);
        this.pos.y = clamp(this.pos.y, -MAP_SIZE / 2 + this.size / 2, MAP_SIZE / 2 - this.size / 2);
    }

    // Kaldes fra katte-klassen når den rammer spilleren
    onCollision() {
        // Tag skade
        this.lives--;
        // Sæt 'hurtTimer' så man ved om spilleren har taget skade
        this.hurtTimer = this.hurtLength;
        // Hvis antal liv er mindre eller lig med 0...
        if (this.lives <= 0) {
            // ...start et nyt spil
            gameSetup();
        }
    }

    // Kaldes fra 'draw' funktion hvert frame
    update() {
        // 'keyIsDown' returnere en boolean om hvorvidt knappen er trykket
        // true har værdien 1 og false har værdien 0
        // Derfor vil 'moveAxis' være (-1, 1) hvis w og d er trykket
        this.moveAxis.set(keyIsDown(68) - keyIsDown(65), keyIsDown(83) - keyIsDown(87));
        // gør at længden på 'moveAxis' vektoren altid har længden 1
        this.moveAxis.normalize();

        // Opdater spillerens hastighed
        this.vel.set((this.vel.x + this.moveAxis.x * this.speed) * this.friction, (this.vel.y + this.moveAxis.y * this.speed) * this.friction);
        // Tilføj hastigheden til spilleren position
        this.pos.add(this.vel);

        // Sørg for at spillerens position er inde for banen
        this.borderCheck();

        // Hvis 'hurtTimer' ikke er 0 ved vi at spilleren har mistet et liv
        if (this.hurtTimer != 0) this.hurtTimer--;

        // Sæt 'cameraPos' til spilleres position, dermed vil kameraet følge spilleren
        cameraPos.set(this.pos);
    }

    // Kaldes til at tegne spilleren
    display() {
        // Sørg for at ændringer hos spilleren ikke ændre f.eks. katten
        push();
        // Ryk (0, 0) til spilleren position
        // Dette gøres for ikke at ødelægge rotationen
        translate(this.pos.x, this.pos.y);

        // Find vinklen ud fra spilleren hastighedsvektor
        let angle = atan(this.vel.y / this.vel.x) + HALF_PI * 3;
        if (this.vel.x < 0) angle += PI;
        // Roter det lokale koordinatsystem
        rotate(angle);

        // Zoom spilleren hvis 'hurtTimer' ikke er 0 (for at vise visuelt at spilleren har taget skade)
        if (this.hurtTimer != 0) scale(this.hurtTimer / this.hurtLength, this.hurtTimer / this.hurtLength);
        // Tegn 'mouseImg' i (0, 0)
        image(mouseImg, 0, 0, this.size, this.size);

        // 'pop' gør f.eks. at alt efter spilleren ikke bliver roteret sammen med spilleren
        pop();
    }

    // Tegn liv hos spilleren
    drawLives() {
        // Hvis spilleren har taget skade, farv teksten rød i stedet for hvid
        if (this.hurtTimer != 0) fill(255, 0, 0);
        else fill(255);
        // Skriv "HP: 3" på skærmen hvis spilleren har 3 liv
        text("HP: " + str(this.lives), width - 150, height - 150);
    }
}

// Kat-klasse
class Cat {
    // Kaldes når man laver et nyt 'Cat'-objekt
    constructor() {
        // Find en tilfældig distance og vinkel at starte katten i
        let d = random(500, MAP_SIZE / 2);
        let a = random(0, TWO_PI);

        // Position, hastighed og retning for hver individuel kat
        this.pos = createVector(cos(a) * d, sin(a) * d);
        this.vel = createVector(0, 0);
        this.dir = createVector(0, 0);

        // 'currentTarget' er en vektor som katten bevæger sig imod
        this.currentTarget = createVector(0, 0);
        this.pickTarget();
        // 'touchingPlayer' er en boolean som siger om hvorvidt katten har ramt spilleren, så samme kat ikke skader dig flere gange
        this.touchingPlayer = false;
        // Sandsynligheden i procent for om katten vil følge efter spilleren eller finde et tilfældigt mål
        this.targetPlayerPercent = 0.35;

        // Hastighed og størrelse for katten
        this.speed = 5;
        this.size = 120;
    }

    // Funktion der vælger et nyt mål som katten jagter
    pickTarget() {
        // Hvis et tilfældigt tal imellem 0 og 1 er mindre en 'targetPlayerPercent'...
        if (random(0, 1) < this.targetPlayerPercent) {
            // ...så sæt 'currentTarget' til spillerens position
            this.currentTarget.set(player.pos);
        } else {
            // ...ellers sæt 'currentTarget' til et tilfældigt sted på banen
            this.currentTarget.set(random(-MAP_SIZE / 2, MAP_SIZE / 2), random(-MAP_SIZE / 2, MAP_SIZE / 2));
        }
    }

    // Kattens opdaterings-funktion. Kaldes hvert frame
    update() {
        // Sæt 'dir' til vektoren mellem den nuværende position og 'currentTarget'
        this.dir = p5.Vector.sub(this.currentTarget, this.pos);
        // Vælgt et nyt mål hvis distancen til målet er mindre end 'speed'
        // Dette gøres for at undgå at katten aldrig rammer målet, da det kan ske at katten overskyder målet
        if (abs(this.dir.x) < this.speed && abs(this.dir.y) < this.speed) this.pickTarget();
        // Gør at længden på 'dir' er 1
        this.dir.normalize();

        // Sæt 'vel' til 'dir' * 'speed'
        this.vel.set(this.dir.x * this.speed, this.dir.y * this.speed);
        // Tilføj hastiheden til positionen
        this.pos.add(this.vel);

        // Hæv kattens hastighed for at gøre spillet en smule sværer senere hen
        this.speed *= 1.0001;

        // 'distToPlayer' er distancen fra katten til spilleren og udregnes med Pythagoras læresætning
        let distToPLayer = sqrt(sq(this.pos.x - player.pos.x) + sq(this.pos.y - player.pos.y));
        // Hvis distancen er mindre end de 2 radier tilsammen...
        if (distToPLayer <= this.size / 2 + player.size / 2) {
            // ...og hvis katten ikke alderede har angrebet spilleren...
            if (!this.touchingPlayer) {
                // ...kald spillerens 'onCollision' funktion
                player.onCollision();
                // og sæt 'touchingPlayer' til true så spilleren kun tager skade en gang
                this.touchingPlayer = true;
            }
        }
        // Ellers hvis vi ikke rører ved spilleren, men vi har gjort det...
        else if (this.touchingPlayer) {
            // ...sæt 'touchingPlayer' til false så katten kan skade spilleren igen
            this.touchingPlayer = false;
        }
    }

    // Funktion til at tegne katten
    display() {
        // 'v' er en vektoren imellem kameraet og kattens position
        let v = p5.Vector.sub(this.pos, cameraPos);
        // Hvis katten er inde for skærmen...
        if (abs(v.x) <= width && abs(v.x) > 0 && abs(v.y) <= height && abs(v.y) > 0) {
            // ...tegn 'catImg' ved kattens position
            image(catImg, this.pos.x, this.pos.y, this.size, this.size);
        }
    }
}

// Funktion der kaldes før alt andet
function preload() {
    // Indlæs 'mouseImg' og 'catImg'
    mouseImg = loadImage("mouse.png");
    catImg = loadImage("cat.png");
}

// Kaldes en gang før spillet går i gang
function setup() {
    // Lav et canvas med en bredde og højde lig med skærmens bredde og højde
    createCanvas(windowWidth, windowHeight);

    // Sæt 'cameraPos' til en vektor
    cameraPos = createVector(0, 0);

    // Sæt skriftstørrelse og gør at det bliver tegnet i midten
    textSize(40);
    textAlign(CENTER, CENTER);

    // Gør at alle billeder bliver tegnet fra midten, i stedet for top venstre hjørne
    imageMode(CENTER);

    // Kald 'gameSetup' som sætter bla. genstarter spiller og score
    gameSetup();
}

// Kaldes hver gang spillet skal (gen)starte
function gameSetup() {
    // Lav en ny spiller
    player = new Player();

    // Sæt 'cats' listen til en ny tom liste
    cats = [];
    // Lav en ny kat 'NUM_CATS' antal gange
    for (let i = 0; i < NUM_CATS; i++) cats.push(new Cat());

    // Hvis scoren er større end highscoren, opdater highscoren
    // Dette sker kun nå spilleren dør
    if (score > highscore) highscore = score;
    // Sæt scoren til 0
    score = 0;
}

// Kaldes mange gange i sekundet
function draw() {
    // Lav en sort baggrund
    background(0);

    // Tilføj til scoren
    score += 0.01 * DIFFICULTY;

    // Opdater spiller og alle kattene
    player.update();
    for (let i = 0; i < NUM_CATS; i++) cats[i].update();

    // 'push' laver (overfladisk) et nyt koordinatsystem som kan roteres, hives og skaleres
    push();
    // Gør at kamera-positionen er i center af skærmen
    translate(width / 2 - cameraPos.x, height / 2 - cameraPos.y);

    // Lav en firkant med en lysebrun farve
    fill(175, 131, 49);
    rect(-MAP_SIZE / 2, -MAP_SIZE / 2, MAP_SIZE, MAP_SIZE);

    // Tegn spilleren og alle kattene
    player.display();
    for (let i = 0; i < NUM_CATS; i++) cats[i].display();

    // 'pop' sletter det koordinatsystem man laver i 'push'
    pop();

    // Skriv bedste score og nuværrende score ud til lærredet
    text("BEST: " + str(highscore.toFixed(2)), 150, 150);
    text("SCORE: " + str(score.toFixed(2)), 150, 200);
    // Tegn spillerens liv
    player.drawLives();
}

// Kaldes hver gang en tast på tastaturet er trykket
function keyPressed() {
    // Hvis knappen der er trykket er ECS og spillet er på pause...
    if (keyCode == ESCAPE && !isLooping()) {
        // ...start spillet igen
        loop();
    }
    // Hvis kanppen en ECS og spillet ikke er på pause
    else if (keyCode == ESCAPE && isLooping()) {
        // ...sæt spillet på pause
        noLoop();
    }
}
