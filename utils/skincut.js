const { PNG } = require("pngjs");

const headSize = {
    width: 8,
    height: 8,
};

const frontSize = {
    width: 16,
    height: 32,
};

const skinOffs = {
    head: {
        source: { xMin: 8, yMin: 8 },
        out: { xMin: 4, xMax: 11, yMin: 0, yMax: 7 },
    },
    lHand: {
        source: { xMin: 44, yMin: 20 },
        out: { xMin: 0, xMax: 3, yMin: 8, yMax: 19 },
    },
    body: {
        source: { xMin: 20, yMin: 20 },
        out: { xMin: 4, xMax: 11, yMin: 8, yMax: 19 },
    },
    rHand: {
        source: { xMin: 44, yMin: 20 },
        out: { xMin: 12, xMax: 15, yMin: 8, yMax: 19 },
    },
    lLeg: {
        source: { xMin: 4, yMin: 20 },
        out: { xMin: 4, xMax: 7, yMin: 20, yMax: 31 },
    },
    rLeg: {
        source: { xMin: 4, yMin: 20 },
        out: { xMin: 8, xMax: 11, yMin: 20, yMax: 31 },
    },
    cl_Head: {
        source: { xMin: 40, yMin: 8 },
        out: { xMin: 4, xMax: 11, yMin: 0, yMax: 7 },
    },

    cl_body: {
        source: { xMin: 20, yMin: 36 },
        out: { xMin: 4, xMax: 11, yMin: 8, yMax: 19 },
    },

    cl_lHand: {
        source: { xMin: 44, yMin: 36 },
        out: { xMin: 0, xMax: 3, yMin: 8, yMax: 19 },
    },

    cl_rHand: {
        source: { xMin: 52, yMin: 52 },
        out: { xMin: 12, xMax: 15, yMin: 8, yMax: 19 },
    },
    cl_lLeg: {
        source: { xMin: 4, yMin: 36 },
        out: { xMin: 4, xMax: 7, yMin: 20, yMax: 31 },
    },
    cl_rLeg: {
        source: { xMin: 4, yMin: 52 },
        out: { xMin: 8, xMax: 11, yMin: 20, yMax: 31 },
    },
};

const sizes = {
    8192: 32,
    16384: 64,
    65536: 128
};

function extractImageToMatrix(data) {
    const arrayImage = [];
    const size = sizes[data.length];

    while (data.length != 0) {
        arrayImage.push([data[0], data[1], data[2], data[3]]);
        data.splice(0, size % 10);
    }

    const matrixImage = new Array(size);
    for (let i = 0; i < matrixImage.length; i++) matrixImage[i] = new Array(size);

    for (let i = 0, y = 0, x = 0; i < arrayImage.length; i++) {
        matrixImage[y][x] = arrayImage[i];

        if (x === (size - 1)) {
            x = 0;
            y++;
        } else x++;
    }

    return matrixImage;
}

export function createFrontImageFromSkin(skinPath) {
    const imageMatrix = extractImageToMatrix(skinPath);

    let rawData = new Array(32);

    for (let i = 0; i < rawData.length; i++) {
        rawData[i] = new Array(16);
        rawData[i].fill([0, 0, 0, 0]);
    }

    for (const keys in skinOffs) {
        let mx = skinOffs[keys].out.xMin,
            my = skinOffs[keys].out.yMin,
            rx = skinOffs[keys].source.xMin,
            ry = skinOffs[keys].source.yMin;

        if (keys === 'rHand' || keys === 'rLeg') {
            for (mx = skinOffs[keys].out.xMax, my, rx, ry; my <= skinOffs[keys].out.yMax && mx >= skinOffs[keys].out.xMin; mx--, rx++) {
                rawData[my][mx] = imageMatrix[ry][rx];

                if (mx === skinOffs[keys].out.xMin) {
                    my++, ry++;

                    mx = skinOffs[keys].out.xMax + 1;
                    rx = skinOffs[keys].source.xMin - 1;
                }
            }
            continue;
        }

        for (mx, my, rx, ry; my <= skinOffs[keys].out.yMax && mx <= skinOffs[keys].out.xMax; mx++, rx++) {
            if (imageMatrix[ry][rx] != undefined && imageMatrix[ry][rx][3] != 0) {
                rawData[my][mx] = imageMatrix[ry][rx];
            }

            if (mx === skinOffs[keys].out.xMax) {
                my++, ry++;

                mx = skinOffs[keys].out.xMin - 1;
                rx = skinOffs[keys].source.xMin - 1;
            }
        }
    }
    const imageData = Uint8ClampedArray.from(rawData.flat().flat());
    const png = new PNG({ width: frontSize.width, height: frontSize.height });

    png.data = Buffer.from(imageData);
    return PNG.sync.write(png);
}

export function createHeadImageFromSkin(skinPath) {
    const imageMatrix = extractImageToMatrix(skinPath);

    const rawData = [];

    for (let x = 8, y = 8; x <= 15 && y <= 15; x++) {
        rawData.push(imageMatrix[y][x]);

        if (x === 15) {
            y++;
            x = 7;
        }
    }

    for (let x = 40, y = 8, i = 0; x <= 47 && y <= 15; x++, i++) {
        if (imageMatrix[y][x] != undefined && imageMatrix[y][x][3] != 0) rawData[i] = imageMatrix[y][x];

        if (x === 47) {
            y++;
            x = 39;
        }
    }

    const imageData = Uint8ClampedArray.from(rawData.flat());
    const png = new PNG({ width: headSize.width, height: headSize.height });

    png.data = Buffer.from(imageData);
    return PNG.sync.write(png);
}