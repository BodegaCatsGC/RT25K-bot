// src/utils/simulation.js

const DEFAULT_BOOST_FACTOR = 0.2;

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
      if (!team || !team.team) continue;
      
      teamData[team.team] = {
        power: team.totalPoints || 0,
        activity: 1.0,
        group: team.group || 'DefaultGroup',
        originalData: team
      };
    }
    
    return teamData;
  }

  prepareMatches(schedule) {
    const matches = [];
    
    for (const match of schedule) {
      if (!match.homeTeam || !match.awayTeam) continue;
      
      // Skip matches that have already been played
      const isCompleted = match.seriesWinner !== null && match.seriesWinner !== 'N/A';
      
      // Calculate total scores from all games
      let score1 = 0;
      let score2 = 0;
      
      if (match.games && match.games.length > 0) {
        match.games.forEach(game => {
          if (game.homeScore > game.awayScore) score1++;
          else if (game.awayScore > game.homeScore) score2++;
        });
      }
      
      matches.push({
        team1: match.homeTeam,
        team2: match.awayTeam,
        score1: score1,
        score2: score2,
        group: 'DefaultGroup', // Group not available in schedule, use default
        completed: isCompleted,
        originalData: match
      });
    }
    
    return matches;
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

  simulateRemainingMatches() {
    const results = {};

    // Initialize group standings
    for (const team of this.standings) {
      if (!team || !team.team) continue;
      
      const group = team.group || 'DefaultGroup';
      if (!results[group]) {
        results[group] = [];
      }
      
      results[group].push({
        team: team.team,
        points: team.totalPoints || 0,
        wins: 0,  // These will be updated based on matches
        losses: 0,
        roundWins: 0,
        roundLosses: 0,
        mapDiff: 0
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
        // Simulate a best of 3 series
        let score1 = 0, score2 = 0;
        while (score1 < 2 && score2 < 2) {
          const winner = this.simulateGame(match.team1, match.team2);
          if (winner === match.team1) score1++;
          else score2++;
        }
        
        const simulatedMatch = {
          ...match,
          score1: score1,
          score2: score2,
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
}

module.exports = {
  RT25KSimulator
};
