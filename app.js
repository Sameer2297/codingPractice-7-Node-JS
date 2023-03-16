const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");

let db;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(5000, () => {
      console.log("Server started running!!!");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

convertPlayerDetails = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

convertMatchDetails = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

convertPlayerMatchScore = (dbObj) => {
  return {
    playerMatchId: dbObj.player_match_id,
    playerId: dbObj.player_id,
    matchId: dbObj.matchId,
    score: dbObj.score,
    fours: dbObj.fours,
    sixes: dbObj.sixes,
  };
};

//Get Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray.map((each) => convertPlayerDetails(each)));
});

//GET player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const playerDetails = await db.get(getPlayerQuery);
  response.send(convertPlayerDetails(playerDetails));
});

//Update Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match Details API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchDetails(matchDetails));
});

//Get Matches of a Player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchesOfAPlayerQuery = `SELECT match_details.match_id AS matchId,match,year FROM match_details JOIN player_match_score ON match_details.match_id=player_match_score.match_id WHERE player_match_score.player_id = ${playerId};`;
  const matchesOfAPlayerArray = await db.all(matchesOfAPlayerQuery);
  response.send(matchesOfAPlayerArray);
});

//Get Players of a Match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playersOfAMatchQuery = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName FROM player_details JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE player_match_score.match_id = ${matchId};`;
  const playersOfAMatchArray = await db.all(playersOfAMatchQuery);
  response.send(playersOfAMatchArray);
});

//Get Player Stats API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerStatsQuery = `SELECT player_details.player_id AS playerId,player_details.player_name AS playerName, SUM(score) AS totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_details JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE player_details.player_id = ${playerId};`;
  const playerStats = await db.get(playerStatsQuery);
  response.send(playerStats);
});

module.exports = app;
