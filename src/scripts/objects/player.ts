import RenderTexture = Phaser.GameObjects.RenderTexture;

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private readonly rt: Phaser.GameObjects.RenderTexture;
    private readonly trailShape: Phaser.GameObjects.Arc;
    public readonly headParts: Phaser.Physics.Arcade.StaticGroup;
    public readonly bodyParts: Phaser.Physics.Arcade.StaticGroup;
    public readonly activeColliders: Phaser.Physics.Arcade.Collider[] = [];

    private shouldDraw = true;
    public isAlive = true;
    public stop = false;
    private lastPosition: Phaser.Geom.Point;
    public readonly initialTextureKey: string;
    private readonly offsetX: number;
    private readonly offsetY: number;
    private readonly radius = 10;
    private readonly colliderSpawnOffset = 6;
    private readonly turnSpeed = 200;
    private readonly speed = 125;
    private isFirstColliderSpawned = false;
    private readonly holeConfig = {
        every: {
            from: 2,
            to: 4
        },
        size: {
            from: 50,
            to: 75
        }
    }
    private readonly leftKey?: Phaser.Input.Keyboard.Key;
    private readonly rightKey?: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene, rt: RenderTexture, texture: string, leftKey?: number, rightKey?: number, x?: number, y?: number,) {
        super(scene, x ?? 0, y ?? 0, texture);
        if (!x || !y) {
            this.setRandomPositionWithinBounds();
        }

        // use the scene to add the sprite to it. add it to the physical world.
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // hook up the events
        scene.events.on('update', this.update, this);
        this.on('animationcomplete', this.onAnimationComplete, this);

        // set the depth of the sprite higher than colliders,
        this.depth = 2;
        this.rt = rt;
        this.initialTextureKey = texture;
        this.lastPosition = new Phaser.Geom.Point(x, y);

        // set collider as circle
        this.offsetX = this.displayWidth / 2 - this.radius;
        this.offsetY = this.displayHeight / 2 - this.radius;
        this.setCircle(this.radius, this.offsetX, this.offsetY);

        // set collision with bounds
        this.setCollideWorldBounds(true);
        (this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;

        // create parts
        const color = new Phaser.Display.Color().random().color;
        this.trailShape = scene.add.circle(x, y, this.radius, color).setVisible(false);
        this.headParts = scene.physics.add.staticGroup();
        this.bodyParts = scene.physics.add.staticGroup();

        // bind the keys
        this.leftKey = leftKey ? this.scene.input.keyboard.addKey(leftKey) : undefined;
        this.rightKey = rightKey ? this.scene.input.keyboard.addKey(rightKey) : undefined;

        // begin spawning the holes
        this.startHoleSpawning();
    }


    private onAnimationComplete(animation: Phaser.Animations.Animation) {
        if (animation.key === 'explode') {
            this.onAfterExplosion();
        }
    }

    private startHoleSpawning() {
        const spawnAt = Phaser.Math.FloatBetween(this.holeConfig.every.from, this.holeConfig.every.to);
        //console.log(`Will start hole after ${spawnAt}s`)
        setTimeout(() => {

            this.shouldDraw = false;
            const holeSize = Phaser.Math.Between(this.holeConfig.size.from, this.holeConfig.size.to);
            const holeTime = distanceToDuration(holeSize, this.speed);

            //console.log(`Started hole ${holeSize}px large. Will end hole in ${holeTime}s`);
            setTimeout(() => {
                //console.log('Ended hole.');
                this.shouldDraw = true;
                this.startHoleSpawning();
            }, holeTime * 1000)

        }, spawnAt * 1000);
    }


    update(): void {
        if (!this.isAlive || this.stop) {
            this.stopAllMovement();
            return;
        }

        // if keys are set, turn the player
        if (this.leftKey?.isDown) {
            this.turnLeft();
        } else if (this.rightKey?.isDown) {
            this.turnRight();
        } else {
            this.stopTurn();
        }

        // calculate correct velocity from speed and angle
        const velocity = this.scene.physics.velocityFromAngle(this.angle, this.speed);
        this.setVelocity(velocity.x, velocity.y);

        // draw colliders and texture on cavas
        const distance = Phaser.Math.Distance.Between(this.lastPosition.x, this.lastPosition.y, this.x, this.y)
        const shouldDrawColliders = distance > this.colliderSpawnOffset && this.shouldDraw;
        if (shouldDrawColliders) {
            this.headParts.create(this.x + this.offsetX + 1, this.y + this.offsetY + 1)
                .setVisible(false)
                .setCircle(this.radius);
            this.lastPosition.x = this.x;
            this.lastPosition.y = this.y;
            this.rt.draw(this.trailShape, this.x, this.y);
        }


        // dump headparts to body parts after headparts get too long (past neck) - to prevent self bite as the colliders spawn
        const headSize = (this.radius / this.colliderSpawnOffset * 2) + 1;
        if (this.headParts.getLength() > headSize) {
            const lastPart = this.headParts.getChildren()[0];
            this.headParts.remove(lastPart);
            this.bodyParts.add(lastPart);
        }
    }

    public setRandomPositionWithinBounds(offset: number = 100) {
        const {width, height} = this.scene.game.canvas;
        this.setRandomPosition(offset, offset, width - offset * 2, height - offset * 2);
    }

    public turnLeft() {
        this.setAngularVelocity(-this.turnSpeed);
    }

    public turnRight() {
        this.setAngularVelocity(this.turnSpeed);
    }

    private stopTurn() {
        this.setAngularVelocity(0);
    }

    private stopAllMovement() {
        this.setVelocity(0, 0);
        this.stopTurn();
    }

    private onAfterExplosion() {
        this.setTexture(`${this.initialTextureKey}-dead`);
    }

    public activateColliders(active: boolean) {
        this.activeColliders.forEach(collider => {
            collider.active = active;
        });
    }

    public onBoundsCollision() {
        if (this.isAlive) {
            console.log('player', this.texture.key, 'hit wall');
            this.die();
        }
    }

    public onCrash(otherObject: Phaser.GameObjects.GameObject) {
        if (this.isAlive) {
            console.log('player', this.texture?.key, 'crashed');
            this.die();
        }
    }

    private die() {
        this.isAlive = false;
        this.activateColliders(false);
        this.play('explode');
    }


}

// todo move to utls
const distanceToDuration = (distance: number, velocity: number) => (distance / velocity)