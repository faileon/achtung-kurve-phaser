import Player from "../objects/player";
import fpsText from "../objects/fpsText";

export default class MainScene extends Phaser.Scene {
    private readonly players: Player[] = [];
    private deadText: Phaser.GameObjects.Text;
    private renderTexture: Phaser.GameObjects.RenderTexture;
    private resetRoundTimer;


    constructor() {
        super({key: 'MainScene'})
    }

    create() {
        new fpsText(this);
        this.physics.world.on('worldbounds', this.onWorldBounds)
        this.renderTexture = this.add.renderTexture(0, 0, 1920, 1080);

        const player1 = new Player(this, this.renderTexture, 'herdyn-default', 37, 39);
        const player2 = new Player(this, this.renderTexture, 'agraelus-default', 100, 102,);
        this.players.push(player1, player2);

        this.createCollidersForPlayers();

        /*this.input.keyboard.on('keydown', (ev: KeyboardEvent) => {
            console.log(`keyCode: ${ev.keyCode}`);
        })*/
        this.deadText = this.add.text(this.game.canvas.width / 2, this.game.canvas.height / 2, '', {
            color: 'red',
            fontSize: '28px'
        });

        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers("explosion", {}),
            repeat: 0,

        });
    }

    update() {
        if (this.arePlayersDead()) {
            this.deadText.setText('Všichni jsou mrtví Dejve.')
            this.stopAllPlayers();
            if (!this.resetRoundTimer) {
                this.resetRoundTimer = setTimeout(() => this.resetRound(), 1000);
            }
        }
    }

    private stopAllPlayers() {
        this.players.forEach(p => p.stop = true);
    }

    private arePlayersDead(): boolean {
        return (this.players.filter(p => !p.isAlive).length >= this.players.length - 1);
    }

    onWorldBounds(body: Phaser.Physics.Arcade.Body) {
        let player = body.gameObject;
        if (player instanceof Player) {
            player.onBoundsCollision();
        }
    }

    private resetRound() {
        this.players.forEach(player => {
            player.setTexture(player.initialTextureKey);
            player.headParts.clear(true, true);
            player.bodyParts.clear(true, true);
            player.setRandomPositionWithinBounds();
            player.setRotation(Phaser.Math.Angle.Random());
            player.isAlive = true;
            player.stop = false;

            this.createCollidersForPlayers();

            this.deadText.setText('');
            this.renderTexture.clear();
        });

        this.resetRoundTimer = null;
    }

    private createCollidersForPlayers() {
        this.players.forEach(player1 => {
            const otherPlayers = this.players.filter(p => p !== player1);

            // player biting self
            const selfOverlap = this.physics.add.overlap(player1, player1.bodyParts, (obj1, obj2) => player1.onCrash(obj2));
            player1.activeColliders.push(selfOverlap);

            // make collisions with other players
            otherPlayers.forEach(player2 => {
                // player biting others headparts
                const otherHeadpartsOverlap = this.physics.add.overlap(player1, player2.headParts, (obj1, obj2) => player1.onCrash(obj2));

                // player biting others bodyparts
                const otherBodypartsOverelap = this.physics.add.overlap(player1, player2.bodyParts, (obj1, obj2) => player1.onCrash(obj2));

                // player biting other player directly
                const otherPlayerOverlap = this.physics.add.overlap(player1, player2, (obj1, obj2) => player1.onCrash(obj2));

                // add them to the active list
                player1.activeColliders.push(otherBodypartsOverelap, otherBodypartsOverelap, otherPlayerOverlap);
            })
        })
    }

}
