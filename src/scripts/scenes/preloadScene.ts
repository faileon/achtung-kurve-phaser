export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // todo preload dynamically per folder structure
    this.load.image('herdyn-default', 'assets/img/heroes/herdyn/0.png');
    this.load.image('agraelus-default', 'assets/img/heroes/agraelus/0.png');
    this.load.image('wall', 'assets/img/wall.png');
  }

  create() {
    this.scene.start('MainScene')

    /**
     * This is how you would dynamically import the mainScene class (with code splitting),
     * add the mainScene to the Scene Manager
     * and start the scene.
     * The name of the chunk would be 'mainScene.chunk.js
     * Find more about code splitting here: https://webpack.js.org/guides/code-splitting/
     */
    // let someCondition = true
    // if (someCondition)
    //   import(/* webpackChunkName: "mainScene" */ './mainScene').then(mainScene => {
    //     this.scene.add('MainScene', mainScene.default, true)
    //   })
    // else console.log('The mainScene class will not even be loaded by the browser')
  }
}
