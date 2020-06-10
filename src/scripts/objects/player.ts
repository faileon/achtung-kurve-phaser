import RenderTexture = Phaser.GameObjects.RenderTexture;

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private readonly rt: Phaser.GameObjects.RenderTexture;
    private readonly trailShape: Phaser.GameObjects.Arc;
    public readonly headParts: Phaser.Physics.Arcade.StaticGroup;
    public readonly bodyParts: Phaser.Physics.Arcade.StaticGroup;

    private shouldDraw = true;
    private lastPosition: Phaser.Geom.Point;
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
            to: 100
        }
    }


    constructor(scene: Phaser.Scene, x: number, y: number, rt: RenderTexture, texture: string = 'herdyn-default') {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.depth = 2;
        this.rt = rt;

        this.offsetX = this.displayWidth / 2 - this.radius;
        this.offsetY = this.displayHeight / 2 - this.radius;
        this.setCircle(this.radius, this.offsetX, this.offsetY);

        this.setCollideWorldBounds(true);
        (this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;

        scene.events.on('update', this.update, this);


        const color = new Phaser.Display.Color().random().color;
        this.trailShape = scene.add.circle(x, y, this.radius, color).setVisible(false);
        this.headParts = scene.physics.add.staticGroup();
        this.bodyParts = scene.physics.add.staticGroup();


        this.lastPosition = new Phaser.Geom.Point(x, y);

        scene.physics.add.overlap(this, this.bodyParts, (object1, object2) => {
            console.log(this.texture.key, 'bit self', this.headParts.getLength(), this.bodyParts.getLength());
        });

        this.startHoleSpawning();
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
        // todo input manager
        const cursorKeys = this.scene.input.keyboard.createCursorKeys();
        if (cursorKeys.left?.isDown) {
            this.setAngularVelocity(-this.turnSpeed);
        } else if (cursorKeys.right?.isDown) {
            this.setAngularVelocity(this.turnSpeed);
        } else {
            this.setAngularVelocity(0);
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
        const headSize = (this.radius / this.colliderSpawnOffset * 2)+1;
        if (this.headParts.getLength() > headSize) {
            const lastPart = this.headParts.getChildren()[0];
            this.headParts.remove(lastPart);
            this.bodyParts.add(lastPart);
        }


    }

    public onBoundsCollision() {
        // console.log('bounds');
        console.log('player', this.texture.key, 'hit wall');
    }

    public onCrash(otherObject: Phaser.GameObjects.GameObject) {
        console.log('player', this.texture?.key, 'crashed');
    }


}


const distanceToDuration = (distance: number, velocity: number) => (distance/velocity)