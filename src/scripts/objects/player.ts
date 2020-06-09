import RenderTexture = Phaser.GameObjects.RenderTexture;

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private readonly rt: Phaser.GameObjects.RenderTexture;
    private readonly trailShape: Phaser.GameObjects.Arc;
    public readonly bodyParts: Phaser.Physics.Arcade.StaticGroup;

    private last_point: Phaser.Geom.Point;
    private readonly offsetX: number;
    private readonly offsetY: number;
    private readonly radius = 16;
    private readonly colliderSpawnOffset = 4;
    private readonly turnSpeed = 200;
    private speed = 125;

    private holeSize = 250;
    private spawnedFirstCollider = false;


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
        this.scene.physics.world.on('worldbounds', this.onBoundsCollision, this); // todo maybe this in scene or rework this


        scene.events.on('update', this.update, this);


        const color = new Phaser.Display.Color().random().color;
        this.trailShape = scene.add.circle(x, y, this.radius, color).setVisible(false);
        this.bodyParts = scene.physics.add.staticGroup();


        this.last_point = new Phaser.Geom.Point(x, y);

        scene.physics.add.overlap(this, this.bodyParts, (object1, object2) => {
            const index = this.bodyParts.getChildren().findIndex(bp => bp === object2);
            if (index < this.bodyParts.getLength() - this.radius/this.colliderSpawnOffset*2) {
                console.log('bit self');
            }
        });
    }

    private toggleDraw = true;

    update(): void {
        const cursorKeys = this.scene.input.keyboard.createCursorKeys();
        if (cursorKeys.left?.isDown) {
            this.setAngularVelocity(-this.turnSpeed);
        } else if (cursorKeys.right?.isDown) {
            this.setAngularVelocity(this.turnSpeed);
        } else {
            this.setAngularVelocity(0);
        }

        this.toggleDraw = !cursorKeys.space?.isDown;

        const velocity = this.scene.physics.velocityFromAngle(this.angle, this.speed);
        this.setVelocity(velocity.x, velocity.y);


        const distance = Phaser.Math.Distance.Between(this.last_point.x, this.last_point.y, this.x, this.y)
        if (distance > this.colliderSpawnOffset && this.toggleDraw) {
            const go: Phaser.GameObjects.GameObject = this.bodyParts.create(this.x + this.offsetX + 1, this.y + this.offsetY + 1)
                .setVisible(false)
                .setCircle(this.radius);
/*            setTimeout(() => {
                go.setActive(true);
            }, 500);*/
            this.last_point.x = this.x;
            this.last_point.y = this.y;
            // this.spawnedFirstCollider = true;
            this.rt.draw(this.trailShape, this.x, this.y);
        }


        //this.rt.draw(this.trailShape, this.x, this.y);


    }

    public onBoundsCollision() {
        // console.log('bounds');
        console.log('player', this.texture.key, 'hit wall');
    }


}
