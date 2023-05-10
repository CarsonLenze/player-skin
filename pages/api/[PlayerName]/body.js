import { createFrontImageFromSkin } from "@/utils/skincut.js";
import axios from "axios";
import sharp from "sharp";
import nbt from "nbt";

export default async function handler(req, res) {
    //get the PlayerName from the request body
    const { PlayerName = null } = req.query;

    //if there is no PlayerName return with not found
    if (!PlayerName) return res.status(404).send("player not found");

    //fetch the players file from the server
    const playerFile = await axios.get(`${process.env.host}/api/client/servers/${process.env.id}/files/contents?file=/players/${PlayerName.toLowerCase()}.dat`, {
        responseType: 'arraybuffer',
        headers: { Authorization: `Bearer ${process.env.key}` }
    }).then(res => res.data)
        .catch(() => null);

    //if no player is found return with not found
    if (!playerFile) return res.status(404).send("player not found");

    //parse the dat file
    const data = await parse(playerFile);

    //create the skin buffer
    const skinBuffer = new Uint8Array(data.Skin.value.Data.value);
    
    //create the head from the buffer
    const body = createFrontImageFromSkin([...skinBuffer]);

    //get the size
    let { size = 100 } = req.query;
    size = parseInt(size);
    
    if (isNaN(size)) size = 100;

    //make sure the size is correct
    if (size < 8) size = 8;
    if (size > 300) size = 300;

    //resize the image
    const buffer = await sharp(body)
    .resize(size, size*2, {
      kernel: sharp.kernel.nearest
    })
    .toBuffer();

    //Return the image to the user
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(buffer);
};

async function parse(file) {
    return new Promise((resolve, reject) => {
        nbt.parse(file, function (error, data) {
            if (error) reject(error)
            resolve(data.value)
        });
    });
}