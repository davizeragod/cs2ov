const SteamUser = require('steam-user');
const SteamID = require('steamid')
const GlobalOffensive = require('globaloffensive');
const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("Server Listening on PORT:", PORT);
});

let user = new SteamUser();

let logonSettings = {
    accountName: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD
};

let amigos = {}

let objProfiles = {}

user.logOn(logonSettings)
let csgo = new GlobalOffensive(user);
user.on('loggedOn', (details) => {
    console.log('Junin tá on');
    user.setPersona(SteamUser.EPersonaState.Online, 'davizeraBOT');
    user.gamesPlayed([730])
});
user.on('friendsList', (details) => {
    amigos = user.myFriends;
})
csgo.on('connectedToGC', (reason) => {
    console.log('conectado ao cordenador de jogo');
});

user.on('friendRelationship', function (steamID, relationship) {
    if (relationship == SteamUser.EFriendRelationship.RequestRecipient) {
        user.addFriend(steamID);
        console.log("Accepted friend request from: " + steamID);
    }
});

app.get('/status/:steamid', (request, response) => {
    console.log(request.params)

    const steamID64Regex = /^[0-9]{17}$/;
    if (!steamID64Regex.test(request.params.steamid)) {
    return response.status(400).send({ error: "Invalid SteamID64" });
    }

    function getRanks(uId) {
        if (amigos[uId] == SteamUser.EFriendRelationship.Friend) {
            let sid = new SteamID(uId)
            csgo.requestPlayersProfile(uId, async (perfil) => {
                console.log(perfil);
                if (perfil && perfil.rankings && perfil.rankings[1]) {
                    objProfiles[perfil.account_id] = {
                        "PremierRating": perfil.rankings[1].rank_id,
                        "TotalCurrentXP": (perfil.player_cur_xp - 327680000),
                        "CurrentLvlPerc": ((perfil.player_cur_xp - 327680000) / 5000),
                        "CurrentLvl": perfil.player_level,
                        "SeasonWins": perfil.rankings[1].wins
                    };
                }
            response.status(200).send(objProfiles[sid.accountid])
            });
        }
        else
            response.status(401).send({
                error: 'User requested is not a friend'
            })
    }

    getRanks(request.params.steamid)
});