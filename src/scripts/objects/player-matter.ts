import RenderTexture = Phaser.GameObjects.RenderTexture;

export default class PlayerMatter extends Phaser.Physics.Matter.Sprite {
    private readonly rt: Phaser.GameObjects.RenderTexture;

    private readonly trailShape: Phaser.GameObjects.Arc;

    private readonly bodyParts: Phaser.Physics.Arcade.StaticGroup;

    private last_point: Phaser.Geom.Point;
    private firstColliderSpawned = false;
    private readonly offsetX: number;
    private readonly offsetY: number;
    private readonly radius = 64;
    private readonly colliderSpawnOffset = 8;
    private readonly turnSpeed = 0.2;
    private speed = 1;


    constructor(world: Phaser.Physics.Matter.World, x: number, y: number, rt: RenderTexture, texture: string = 'herdyn-default') {
        super(world, x, y, texture);
        world.scene.add.existing(this);

        this.depth = 2;
        this.rt = rt;

        this.offsetX = this.displayWidth / 2 - this.radius;
        this.offsetY = this.displayHeight / 2 - this.radius;
        this.setCircle(this.radius);
        console.log('hi', this.offsetX, this.offsetY);

        this.scene.matter.world.on('worldbounds', this.onBoundsCollision, this);


        world.scene.events.on('update', this.update, this);


        const color = new Phaser.Display.Color().random().color;
        this.trailShape = world.scene.add.circle(x, y, this.radius, color).setVisible(false);


        this.last_point = new Phaser.Geom.Point(x, y);

        /*scene.physics.add.overlap(this, this.bodyParts, (object1, object2) => {
            console.log('bite');
        });*/
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

        //const velocity = this.scene.physics.velocityFromAngle(this.angle, this.speed);
        this.setVelocity(Math.sin(this.rotation) * this.speed, -Math.sin(this.rotation) * this.speed);



        const distance = Phaser.Math.Distance.Between(this.last_point.x, this.last_point.y, this.x, this.y)
        if (distance > this.colliderSpawnOffset && this.toggleDraw) {
            this.firstColliderSpawned = true;
            this.scene.matter.add.circle(this.x, this.y, this.radius, {isSensor: true});
            this.last_point.x = this.x;
            this.last_point.y = this.y;
        }

        if (this.firstColliderSpawned && this.toggleDraw) {
            this.rt.draw(this.trailShape, this.x, this.y);
        }


    }

    private onBoundsCollision() {

    }


}