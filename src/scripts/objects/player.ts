import RenderTexture = Phaser.GameObjects.RenderTexture;

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private readonly rt: Phaser.GameObjects.RenderTexture;

    private readonly trailShape: Phaser.GameObjects.Arc;
    private readonly graphics: Phaser.GameObjects.Graphics;
    private readonly marchignSquares = new MarchingSquaresOpt();

    public readonly bodyParts: Phaser.Physics.Arcade.StaticGroup;

    private last_point: Phaser.Geom.Point;
    private firstColliderSpawned = false;
    private readonly offsetX: number;
    private readonly offsetY: number;
    private readonly radius = 16;
    private readonly colliderSpawnOffset = 8;
    private readonly turnSpeed = 200;
    private speed = 125;


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
            if (object2.active){
                console.log('player', this.texture.key, 'bit self');
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
            this.firstColliderSpawned = true;
            const go: Phaser.GameObjects.GameObject = this.bodyParts.create(this.x + this.offsetX+1, this.y+this.offsetY+1)
                .setActive(false)
                .setVisible(false)
                .setCircle(this.radius);
            setTimeout(() => {
                go.setActive(true);
            }, 500);
            this.last_point.x = this.x;
            this.last_point.y = this.y;
        }

        if (this.firstColliderSpawned && this.toggleDraw) {
            this.rt.draw(this.trailShape, this.x, this.y);
        }

/*        if (!this.firstColliderSpawned) {
            if (distance > this.radius * 2){
                this.bodyParts.create(this.last_point.x, this.last_point.y).setVisible(false).setCircle(this.radius, this.offsetX, this.offsetY);
                this.firstColliderSpawned = true;
            }
        } else {
            this.speed = 0;
            //this.bodyParts.create(this.last_point.x, this.last_point.y).setVisible(false).setCircle(this.radius);

        }*/


        /*this.rt.draw(this.trailShape, this.x, this.y);
        const data = this.rt.context.getImageData(0, 0, 1920, 1080);

        let contour = this.marchignSquares.getBlobOutlinePoints(data);

        const simplifiedContour = simplify(contour, 0.95, null);
        // console.log(simplifiedContour);
        const remapped = simplifiedContour.map(ctr => {
            return new Phaser.Geom.Point(ctr[0], ctr[1]);
        });

        const res = Phaser.Geom.Polygon.Contains(new Phaser.Geom.Polygon(remapped), this.x, this.y);
        if (res) {
            console.log('bite!');
        }*/


    }

    private onBoundsCollision() {
        // console.log('bounds');
    }


}


const marchingSquares = {
    superData: [],

    march: function (start?) {
        var grid = marchingSquares.getNonTransparent;
        var points = {'x': [], 'y': []};//empty data set(used in interpolation)

        var s = start || marchingSquares.getStartingPoint(grid), // starting point
            c = [],    // contour polygon
            x = s[0],  // current x position
            y = s[1],  // current y position
            dx = 0,    // next x direction
            dy = 0,    // next y direction
            pdx = NaN, // previous x direction
            pdy = NaN, // previous y direction
            i = 0;

        do {
            // determine marching squares index
            i = 0;
            if (grid(x - 1, y - 1)) i += 1;
            if (grid(x, y - 1)) i += 2;
            if (grid(x - 1, y)) i += 4;
            if (grid(x, y)) i += 8;

            // determine next direction
            if (i === 6) {
                dx = pdy === -1 ? -1 : 1;
                dy = 0;
            } else if (i === 9) {
                dx = 0;
                dy = pdx === 1 ? -1 : 1;
            } else {
                dx = marchingSquares.contourDx[i];
                dy = marchingSquares.contourDy[i];
            }
            // update contour polygon
            if (dx != pdx && dy != pdy) {
                // @ts-ignore
                c.push([x, y]);
                pdx = dx;
                pdy = dy;
            }

            x += dx;
            y += dy;
        } while (s[0] != x || s[1] != y);

        return c;
    },

    // lookup tables for marching directions
    contourDx: [1, 0, 1, 1, -1, 0, -1, 1, 0, 0, 0, 0, -1, 0, -1, NaN],
    contourDy: [0, -1, 0, 0, 0, -1, 0, 0, 1, -1, 1, 1, 0, -1, 0, NaN],

    getStartingPoint: function (grid) {
        var x = 0,
            y = 0;
        // search for a starting point; begin at origin
        // and proceed along outward-expanding diagonals
        while (true) {
            if (grid(x, y)) {
                console.log("found starting point at :" + x + " " + y);
                return [x, y];

            }
            if (x === 0) {
                x = y + 1;
                y = 0;
            } else {
                x = x - 1;
                y = y + 1;
            }
            if (x > 1920 || y > 1080) {
                console.log('failed to find starting point');
                break
            }
            ;

        }
    },

    //the alpha test
    getNonTransparent: function (x, y) {
        var a = marchingSquares.superData[(y * 1920 + x) * 4 + 3];
        return (a > 0);
    }

}

////////////////////////////////douglas peucker algorithm adapted to [x,y]
//////////////////////////////// source: http://mourner.github.io/simplify-js/

// square distance between 2 points

function getSqDist(p1, p2) {

    var dx = p1[0] - p2[0],
        dy = p1[1] - p2[1];

    return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(p, p1, p2) {

    var x = p1[0],
        y = p1[1],
        dx = p2[0] - x,
        dy = p2[1] - y;

    if (dx !== 0 || dy !== 0) {

        var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2[0];
            y = p2[1];

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p[0] - x;
    dy = p[1] - y;

    return dx * dx + dy * dy;
}

// rest of the code doesn't care about point format

// basic distance-based simplification
function simplifyRadialDist(points, sqTolerance) {

    var prevPoint = points[0],
        newPoints = [prevPoint],
        point;

    for (var i = 1, len = points.length; i < len; i++) {
        point = points[i];

        if (getSqDist(point, prevPoint) > sqTolerance) {
            newPoints.push(point);
            prevPoint = point;
        }
    }

    if (prevPoint !== point) newPoints.push(point);

    return newPoints;
}

function step(points, first, last, sqTolerance, simplified) {
    var maxSqDist = sqTolerance,
        index;

    for (var i = first + 1; i < last; i++) {
        var sqDist = getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) step(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) step(points, index, last, sqTolerance, simplified);
    }
}

// simplification using Ramer-Douglas-Peucker algorithm
function DouglasPeucker(points, sqTolerance) {
    var last = points.length - 1;

    var simplified = [points[0]];
    step(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
}

function simplify(points, tolerance, highestQuality): Array<number[]> {

    if (points.length <= 2) return points;

    var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
    points = DouglasPeucker(points, sqTolerance);

    return points;
}

class MarchingSquaresOpt {

    next_step: number;

    getBlobOutlinePoints = (source_array: ImageData) => {
        // Note: object should not be on the border of the array, since there is
        //       no padding of 1 pixel to handle points which touch edges


        const width = source_array.width;
        const height = source_array.height;
        const data4 = source_array.data; // Uint8ClampedArray
        const len = width * height;
        const data = new Uint8Array(len);
        for (let i = 0; i < len; ++i) {
            data[i] = data4[i << 2];
        }

        // find the starting point
        const startingPoint = this.getFirstNonTransparentPixelTopDown(data, width, height);
        if (null === startingPoint) {
            console.log('[Warning] Marching Squares could not find an object in the given array');
            return [];
        }

        // return list of w and h positions
        return this.walkPerimeter(data, width, height, startingPoint.w, startingPoint.h);
    };


    getFirstNonTransparentPixelTopDown = (source_array, width, height) => {
        let idx;
        for (let h = 0 | 0; h < height; ++h) {
            idx = (h * width) | 0;
            for (let w = 0 | 0; w < width; ++w) {
                if (source_array[idx] > 0) {
                    return {w: w, h: h};
                }
                ++idx;
            }
        }
        return null;
    };

    walkPerimeter = (source_array, width, height, start_w, start_h) => {

        width = width | 0;
        height = height | 0;

        // Set up our return list
        const point_list: any[] = [],
            up = 1 | 0, left = 2 | 0, down = 3 | 0, right = 4 | 0;

        let idx = 0 | 0,  // Note: initialize it with an integer, so the JS interpreter optimizes for this type.

            // our current x and y positions, initialized
            // to the init values passed in
            w = start_w,
            h = start_h,

            // the main while loop, continues stepping until
            // we return to our initial points
            next_step;
        do {
            // evaluate our state, and set up our next direction
            idx = (h - 1) * width + (w - 1);
            next_step = this.step(idx, source_array, width);

            // if our current point is within our image
            // add it to the list of points
            if (w >= 0 && w < width && h >= 0 && h < height) {
                point_list.push([w - 1, h]);
            }

            switch (next_step) {
                case up:
                    --h;
                    break;
                case left:
                    --w;
                    break;
                case down:
                    ++h;
                    break;
                case right:
                    ++w;
                    break;
                default:
                    break;
            }

        } while (w != start_w || h != start_h);

        point_list.push([w, h]);

        return point_list;
    };

// determines and sets the state of the 4 pixels that
// represent our current state, and sets our current and
// previous directions

    step = (idx, source_array, width) => {
        //console.log('Sakri.MarchingSquaresOpt.step()');
        // Scan our 4 pixel area
        //Sakri.imageData = Sakri.MarchingSquaresOpt.sourceContext.getImageData(x-1, y-1, 2, 2).data;

        const up_left = 0 < source_array[idx + 1],
            up_right = 0 < source_array[idx + 2],
            down_left = 0 < source_array[idx + width + 1],
            down_right = 0 < source_array[idx + width + 2],
            none = 0 | 0, up = 1 | 0, left = 2 | 0, down = 3 | 0, right = 4 | 0;

        // Determine which state we are in
        let state = 0 | 0;

        if (up_left) {
            state |= 1;
        }
        if (up_right) {
            state |= 2;
        }
        if (down_left) {
            state |= 4;
        }
        if (down_right) {
            state |= 8;
        }

        // State now contains a number between 0 and 15
        // representing our state.
        // In binary, it looks like 0000-1111 (in binary)

        // An example. Let's say the top two pixels are filled,
        // and the bottom two are empty.
        // Stepping through the if statements above with a state
        // of 0b0000 initially produces:
        // Upper Left == true ==>  0b0001
        // Upper Right == true ==> 0b0011
        // The others are false, so 0b0011 is our state
        // (That's 3 in decimal.)

        // Looking at the chart above, we see that state
        // corresponds to a move right, so in our switch statement
        // below, we add a case for 3, and assign Right as the
        // direction of the next step. We repeat this process
        // for all 16 states.

        // So we can use a switch statement to determine our
        // next direction based on
        switch (state) {
            case 1:
                this.next_step = up;
                break;
            case 2:
                this.next_step = right;
                break;
            case 3:
                this.next_step = right;
                break;
            case 4:
                this.next_step = left;
                break;
            case 5:
                this.next_step = up;
                break;
            case 6:
                if (this.next_step == up) {  // info from previous_step
                    this.next_step = left;
                } else {
                    this.next_step = right;
                }
                break;
            case 7:
                this.next_step = right;
                break;
            case 8:
                this.next_step = down;
                break;
            case 9:
                if (this.next_step == right) {  // info from previous_step
                    this.next_step = up;
                } else {
                    this.next_step = down;
                }
                break;
            case 10:
                this.next_step = down;
                break;
            case 11:
                this.next_step = down;
                break;
            case 12:
                this.next_step = left;
                break;
            case 13:
                this.next_step = up;
                break;
            case 14:
                this.next_step = left;
                break;
            default:
                this.next_step = none;  // this should never happen
                break;
        }
        return this.next_step;
    };
}