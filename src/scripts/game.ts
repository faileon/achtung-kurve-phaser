import 'phaser'
import MainScene from './scenes/mainScene'
import PreloadScene from './scenes/preloadScene'
import GameConfig = Phaser.Types.Core.GameConfig;

const DEFAULT_WIDTH = 1920
const DEFAULT_HEIGHT = 1080

const config: GameConfig = {
    type: Phaser.CANVAS,
    backgroundColor: '#ffffff',
    scale: {
        parent: 'phaser-game',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT
    },
    scene: [PreloadScene, MainScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
}

export class AchtungGame extends Phaser.Game {

    constructor(config: GameConfig) {
      super(config);
    }
}

window.onload = () => {
    const game = new AchtungGame(config);
}

