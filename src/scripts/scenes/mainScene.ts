import Player from "../objects/player";
import fpsText from "../objects/fpsText";
import PlayerMatter from "../objects/player-matter";


export default class MainScene extends Phaser.Scene {
    player: Player;


    constructor() {
        super({key: 'MainScene'})
    }

    create() {
        new fpsText(this);
        const rt = this.add.renderTexture(0, 0, 1920, 1080);

        const players: Player[] = [];
        const player1 = new Player(this,400,400, rt);
        //const player2 = new Player(this,400,500, rt, 'agraelus-default');

        players.push(player1, /*player2*/);

        this.physics.world.on('worldbounds', this.onWorldBounds)

        players.forEach(player1 => {
            const otherPlayers = players.filter(p => p !== player1);
            otherPlayers.forEach(player2 => {
                this.physics.add.overlap(player1, player2.headParts, (obj1, obj2) => player1.onCrash(obj2));

                this.physics.add.overlap(player1, player2.bodyParts, (obj1, obj2) => player1.onCrash(obj2));

                this.physics.add.overlap(player1, player2, (obj1, obj2) => player1.onCrash(obj2));


                /*this.physics.add.overlap(player1, player2.headParts, () => {
                    console.log(player1.texture.key, 'bit headpart of', player2.texture.key);
                    player1.onCrash();
                })

                this.physics.add.overlap(player1, player2.bodyParts, () => {
                    console.log(player1.texture.key, 'bit bodypart of', player2.texture.key);
                    player1.onCrash();
                })

                this.physics.add.overlap(player1, player2, () => {
                    console.log(player1.texture.key, 'bit head of', player2.texture.key);
                    player1.onCrash();
                })*/
            })
        })

        //this.matter.world.setBounds().disableGravity();
        //const player = new PlayerMatter(this.matter.world, 400, 400, rt);
    }

    onWorldBounds(body: Phaser.Physics.Arcade.Body) {
        var player = body.gameObject;
        if (player instanceof Player){
            player.onBoundsCollision();
        }
    }

    update() {

    }
}
