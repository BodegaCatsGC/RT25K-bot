// src/utils/simulation.js

const DEFAULT_BOOST_FACTOR = 0.2;
const DEFAULT_BEST_OF_SERIES = 5;

class RT25KSimulator {
  /**
   * @param {Array} standings - Array of team standings from getStandings()
   * @param {Array} schedule - Array of matches from getSchedule()
   */
  constructor(standings, schedule) {
    this.standings = standings;
    this.schedule = schedule;
    this.teamData = this.prepareTeamData(standings);
    this.matches = this.prepareMatches(schedule);
  }

  prepareTeamData(standings) {
    const teamData = {};
    
    for (const team of standings) {
      teamData[team.team] = {
        power: team.points || 0,  // Using points as a proxy for power
        activity: 1.0,  // Default activity level
        group: team.group || 'DefaultGroup'
      };
    }
    
    return teamData;
  }

  prepareMatches(schedule) {
    return schedule
      .filter(match => match.team1 && match.team2)
      .map(match => ({
        team1: match.team1,
        team2: match.team2,
        score1: parseInt(match.score1) || 0,
        score2: parseInt(match.score2) || 0,
        group: match.group || 'DefaultGroup',
        completed: !!match.completed
      }));
  }

  getAdjustedPower(teamName) {
    const team = this.teamData[teamName];
    if (!team) return 0;
    return team.power * (1 + DEFAULT_BOOST_FACTOR * team.activity);
  }

  simulateGame(teamA, teamB) {
    const aPower = this.getAdjustedPower(teamA);
    const bPower = this.getAdjustedPower(teamB);
    const total = aPower + bPower;
    const roll = Math.random() * total;
    return roll < aPower ? teamA : teamB;
  }

  simulateSeries(teamA, teamB) {
    let scoreA = 0;
    let scoreB = 0;
    const requiredWins = Math.ceil(DEFAULT_BEST_OF_SERIES / 2);

    while (scoreA < requiredWins && scoreB < requiredWins) {
      const winner = this.simulateGame(teamA, teamB);
      if (winner === teamA) scoreA++;
      else scoreB++;
    }

    return {
      winner: scoreA > scoreB ? teamA : teamB,
      scoreA,
      scoreB
    };
  }

  simulateRemainingMatches() {
    const results = {};

    // Initialize group standings
    for (const team of this.standings) {
      const group = team.group || 'DefaultGroup';
      if (!results[group]) {
        results[group] = [];
      }
      
      results[group].push({
        team: team.team,
        points: team.points || 0,
        matchesPlayed: team.matchesPlayed || 0,
        wins: team.wins || 0,
        losses: team.losses || 0,
        roundWins: team.roundWins || 0,
        roundLosses: team.roundLosses || 0,
        mapDiff: (team.roundWins || 0) - (team.roundLosses || 0)
      });
    }

    // Process completed matches
    this.matches.forEach(match => {
      if (match.completed) {
        this.updateStandings(results, match);
      }
    });

    // Simulate remaining matches
    for (const match of this.matches) {
      if (!match.completed) {
        const { winner, scoreA, scoreB } = this.simulateSeries(match.team1, match.team2);
        const simulatedMatch = {
          ...match,
          score1: scoreA,
          score2: scoreB,
          completed: true
        };
        this.updateStandings(results, simulatedMatch);
      }
    }

    // Sort each group
    for (const group of Object.values(results)) {
      group.sort((a, b) => {
        // Sort by points (descending)
        if (a.points !== b.points) return b.points - a.points;
        
        // Then by map difference (descending)
        const aDiff = a.roundWins - a.roundLosses;
        const bDiff = b.roundWins - b.roundLosses;
        if (aDiff !== bDiff) return bDiff - aDiff;
        
        // Then by head-to-head (if applicable)
        const headToHead = this.getHeadToHead(a.team, b.team, group.map(t => t.team));
        if (headToHead) return headToHead;
        
        // Finally, by round wins (descending)
        return b.roundWins - a.roundWins;
      });
    }

    return results;
  }

  updateStandings(standings, match) {
    const { team1, team2, score1, score2, group } = match;
    const groupStandings = standings[group] || [];
    
    const team1Standing = groupStandings.find(t => t.team === team1);
    const team2Standing = groupStandings.find(t => t.team === team2);

    if (!team1Standing || !team2Standing) return;

    // Update matches played
    team1Standing.matchesPlayed++;
    team2Standing.matchesPlayed++;

    // Update round wins/losses
    team1Standing.roundWins += score1;
    team1Standing.roundLosses += score2;
    team2Standing.roundWins += score2;
    team2Standing.roundLosses += score1;

    // Update match results
    if (score1 > score2) {
      team1Standing.wins++;
      team2Standing.losses++;
      team1Standing.points += 3;
    } else if (score2 > score1) {
      team2Standing.wins++;
      team1Standing.losses++;
      team2Standing.points += 3;
    } else {
      team1Standing.points += 1;
      team2Standing.points += 1;
    }

    // Update map difference
    team1Standing.mapDiff = team1Standing.roundWins - team1Standing.roundLosses;
    team2Standing.mapDiff = team2Standing.roundWins - team2Standing.roundLosses;
  }

  getHeadToHead(teamA, teamB, groupTeams) {
    const matches = this.matches.filter(match => 
      ((match.team1 === teamA && match.team2 === teamB) || 
       (match.team1 === teamB && match.team2 === teamA)) &&
      match.completed
    );

    if (matches.length === 0) return null;

    let aPoints = 0;
    let bPoints = 0;

    for (const match of matches) {
      if (match.score1 > match.score2) {
        if (match.team1 === teamA) aPoints += 3;
        else bPoints += 3;
      } else if (match.score2 > match.score1) {
        if (match.team2 === teamA) aPoints += 3;
        else bPoints += 3;
      } else {
        aPoints += 1;
        bPoints += 1;
      }
    }

    if (aPoints > bPoints) return -1;
    if (bPoints > aPoints) return 1;
    return 0;
  }
}

module.exports = {
  RT25KSimulator
};
