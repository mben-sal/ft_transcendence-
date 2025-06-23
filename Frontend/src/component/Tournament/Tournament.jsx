import { useState } from 'react';
import './Tournament.css';
import PingPongGame from './PingPongGame';

const getRandomAvatar = () => {
  const id = Math.floor(Math.random() * 1000); // genere 0 -> 999
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`;
};

const Matchup = ({ player1, player2, onWinnerSelected, gameInProgress, setGameInProgress }) => {
    const [gameActive, setGameActive] = useState(false);
    const [gameResult, setGameResult] = useState(null);
  
    const handleGameEnd = (winner) => {
      setGameActive(false);
      setGameInProgress(false); // Réactive les autres boutons
      setGameResult(winner === 1 ? 'player1' : 'player2');
      onWinnerSelected(winner === 1 ? player1 : player2);
    };
  
    const handlePlayClick = () => {
      setGameActive(true);
      setGameInProgress(true); // Désactive les autres boutons
    };
  
    return (
      <div className="matchup">
        {gameActive ? (
          <div className="game-container">
            <PingPongGame 
              player1Name={player1.alias}
              player2Name={player2.alias}
              onGameEnd={handleGameEnd}
            />
          </div>
        ) : (
          <div className="face-to-face">
            <div className={`player ${gameResult === 'player1' ? 'winner' : ''}`}>
              <img src={player1.image} alt={player1.alias} />
              <p>{player1.alias}</p>
              {gameResult && (
                <span className="result-indicator">
                  {gameResult === 'player1' ? '✓' : '✗'}
                </span>
              )}
            </div>
            
            <div className="vs-circle">VS</div>
            
            <div className={`player ${gameResult === 'player2' ? 'winner' : ''}`}>
              <img src={player2.image} alt={player2.alias} />
              <p>{player2.alias}</p>
              {gameResult && (
                <span className="result-indicator">
                  {gameResult === 'player2' ? '✓' : '✗'}
                </span>
              )}
            </div>
            
            {!gameResult && (
              <button 
                onClick={handlePlayClick} // Utilise handlePlayClick au lieu de setGameActive directement
                className="play-button"
                disabled={gameInProgress && !gameActive} // Désactive si un autre jeu est en cours
              >
                Jouer
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  

const Tournement = () => {
  const [tournamentName, setTournamentName] = useState('');
  const [nbrPlayer, setNbrPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [winners, setWinners] = useState([]);
  const [finalWinner, setFinalWinner] = useState(null);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [duplicateAliases, setDuplicateAliases] = useState([]);
  const [gameInProgress, setGameInProgress] = useState(false);

  const checkDuplicateAliases = () => {
    const aliasMap = {};
    const duplicates = [];
    
    players.forEach(player => {
      const alias = player.alias.trim().toLowerCase();
      if (alias) {
        if (aliasMap[alias]) {
          if (!duplicates.includes(alias)) {
            duplicates.push(alias);
          }
        } else {
          aliasMap[alias] = true;
        }
      }
    });

    setDuplicateAliases(duplicates);
    return duplicates.length > 0;
  };

  const getInputClass = (alias) => {
    const trimmedAlias = alias.trim().toLowerCase();
    return duplicateAliases.includes(trimmedAlias) && trimmedAlias !== ''
      ? 'player-input duplicate'
      : 'player-input';
  };

  const handleStartTournament = () => {
    if (checkDuplicateAliases()) {
      return;
    }

    if (!isFormValid()) {
      alert("Please fill in all player names and tournament name");
      return;
    }

    const initialMatchups = [];
    for (let i = 0; i < players.length; i += 2) {
      initialMatchups.push({
        player1: players[i],
        player2: players[i + 1],
      });
    }

    setMatchups(initialMatchups);
    setWinners([]);
    setFinalWinner(null);
    setTournamentStarted(true);
  };

  const onWinnerSelected = (winner) => {
    const updatedWinners = [...winners, winner];

    if (updatedWinners.length === matchups.length * 2 / 2) {
      if (updatedWinners.length === 1) {
        setFinalWinner(updatedWinners[0]);
        return;
      }

      const nextMatchups = [];
      for (let i = 0; i < updatedWinners.length; i += 2) {
        nextMatchups.push({
          player1: updatedWinners[i],
          player2: updatedWinners[i + 1],
        });
      }

      setMatchups(nextMatchups);
      setWinners([]);
    } else {
      setWinners(updatedWinners);
    }
  };

  const handlePlayerInfoChange = (index, field, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index] = {
      ...updatedPlayers[index],
      [field]: value,
    };
    setPlayers(updatedPlayers);
  };

  const handleSelectNbrPlayer = (num) => {
    if (num % 2 === 0) {
      setNbrPlayer(num);
      const initialPlayers = Array.from({ length: num }, (_, index) => ({
        alias: '',
        image: getRandomAvatar(),
        id: index,
      }));
      setPlayers(initialPlayers);
      setDuplicateAliases([]);
    } else {
      alert("Please select an even number of players for the tournament.");
    }
  };

  const regenerateImage = (index) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].image = getRandomAvatar();
    setPlayers(updatedPlayers);
  };

  const isFormValid = () => {
    return (
      tournamentName.trim() !== '' &&
      nbrPlayer &&
      players.every((player) => player.alias.trim() !== '') &&
      duplicateAliases.length === 0
    );
  };

  const resetTournament = () => {
    setTournamentStarted(false);
    setMatchups([]);
    setWinners([]);
    setFinalWinner(null);
    setDuplicateAliases([]);
  };

  return (
    <div className="tournament-container">
      <h2 className="tournament-title">
        {tournamentStarted ? tournamentName : "Create Tournament"}
      </h2>
  
      {!tournamentStarted ? (
        <div className="setup-phase">
          <input
            type="text"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Tournament Name"
            className="tournament-input"
          />
  
          <div className="player-buttons">
            {[4, 8].map((num) => (
              <button
                key={num}
                onClick={() => handleSelectNbrPlayer(num)}
                className={`player-button ${nbrPlayer === num ? 'selected' : ''}`}
              >
                {num} Players
              </button>
            ))}
          </div>
  
          {nbrPlayer && (
            <div className={`players-grid ${nbrPlayer === 4 ? 'grid-2x2' : 'grid-4x2'}`}>
              {players.map((player, index) => (
                <div key={player.id || index} className="player-form">
                  <input
                    type="text"
                    placeholder={`Player ${index + 1} Name`}
                    value={player.alias}
                    onChange={(e) => handlePlayerInfoChange(index, 'alias', e.target.value)}
                    onBlur={checkDuplicateAliases}
                    className={getInputClass(player.alias)}
                  />
                  <div className="avatar-frame" onClick={() => regenerateImage(index)}>
                    <img src={player.image} alt={`Avatar ${index + 1}`} className="avatar-img" />
                    <p className="avatar-hint">Click to change</p>
                  </div>
                  {duplicateAliases.includes(player.alias.trim().toLowerCase()) && player.alias.trim() !== '' && (
                    <div className="duplicate-error">This name is already used!</div>
                  )}
                </div>
              ))}
            </div>
          )}
  
          {isFormValid() ? (
            <button onClick={handleStartTournament} className="start-button">
              Start Tournament
            </button>
          ) : (
            <button className="start-button disabled" disabled>
              Start Tournament
            </button>
          )}
        </div>
      ) : (
        <div className="tournament-phase">
          <button 
            onClick={resetTournament}
            className="back-button"
          >
            ← Back to Setup
          </button>
  
          {finalWinner ? (
            <div className="champion-container">
              <div className="trophy-icon">🏆</div>
              <h3>Tournament Champion!</h3>
              <img src={finalWinner.image} alt={finalWinner.alias} className="champion-avatar" />
              <h2>{finalWinner.alias}</h2>
              <button onClick={resetTournament} className="restart-button">
                Create New Tournament
              </button>
            </div>
          ) : (
            <div className="matchups-phase">
              <h3 className="round-title">Round {Math.log2(players.length) - Math.log2(matchups.length * 2) + 1}</h3>
              <div className="matchups-grid">
                {matchups.map((matchup, index) => (
                  <Matchup
                    key={`${matchup.player1.id}-${matchup.player2.id}`}
                    player1={matchup.player1}
                    player2={matchup.player2}
                    onWinnerSelected={onWinnerSelected}
                    gameInProgress={gameInProgress}
                    setGameInProgress={setGameInProgress}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tournement;