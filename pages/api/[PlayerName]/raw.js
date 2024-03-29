import axios from "axios";
import nbt from "nbt";

export default async function handler(req, res) {
    //get the PlayerName from the request body
    const { PlayerName = null } = req.query;

    //if there is no PlayerName return with not found
    if (!PlayerName) return res.status(404).send("player not found");

    //fetch the players file from the server
    const playerFile = await axios.get(`${process.env.host}/api/client/servers/${process.env.id}/files/contents?file=/players/${PlayerName.toLowerCase()}.dat`, {
        responseType: "arraybuffer",
        headers: { Authorization: `Bearer ${process.env.key}` }
    })
    .then(res => res.data)
    .catch(() => { /* Not Found */ });

    //if no player is found return with not found
    if (!playerFile) return res.status(404).send("player not found");

    //parse the dat file
    const data = await parse(playerFile);

    //cache the request
    //cache the image for 5 minutes
    res.setHeader(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=3600"
    );

    //send the data
    return res.status(200).send(data);
};

async function parse(file) {
    return new Promise((resolve, reject) => {
        nbt.parse(file, function (error, data) {
            if (error) reject(error)
            resolve(data.value)
        });
    });
}