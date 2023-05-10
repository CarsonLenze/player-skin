import { createHeadImageFromSkin } from "@/utils/skincut.js";
import axios from "axios";
import sharp from "sharp";
import nbt from "nbt";
import fs from "fs";

export default async function handler(req, res) {
    //get the PlayerName from the request body
    const { PlayerName = null } = req.query;

    //cache the request
    //cache the image for 5 minutes
    res.setHeader(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=3600"
    );

    //set the image header
    res.setHeader("Content-Type", "image/png");

    //import the fallback image
    const fallback = fs.readFileSync("./public/head.png");

    //if there is no PlayerName return with not found
    if (!PlayerName) return res.status(200).send(fallback);

    //fetch the players file from the server
    const PlayerFile = await axios.get(`${process.env.host}/api/client/servers/${process.env.id}/files/contents?file=/players/${PlayerName.toLowerCase()}.dat`, {
        responseType: "arraybuffer",
        headers: { Authorization: `Bearer ${process.env.key}` }
    })
        .then(res => res.data)
        .catch(() => { /* Not Found */ });

    //if no player is found return with not found
    if (!PlayerFile) return res.status(200).send(fallback);

    //parse the dat file
    const data = await parse(PlayerFile);

    //create the skin buffer
    const skinBuffer = new Uint8Array(data.Skin.value.Data.value);

    //create the head from the buffer
    const head = createHeadImageFromSkin([...skinBuffer]);

    //resize the image
    const buffer = await sharp(head)
        .resize(180, 180, {
            kernel: sharp.kernel.nearest
        })
        .toBuffer();

    //return the image to the user
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