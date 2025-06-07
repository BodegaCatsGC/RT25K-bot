// src/utils/simulation.js

// Activity level multipliers
const ACTIVITY_MULTIPLIERS = {
  active: 1.0,    // Full boost for active teams
  partial: 0.5,   // Half boost for partially active teams
  inactive: 0.1   // Minimal boost for inactive teams
};

// Base power calculation parameters
const BASE_POWER_MULTIPLIER = 0.1;  // How much total_points affect power
const MIN_POWER = 0.5;              // Minimum power level for any team
const RANDOMNESS_FACTOR = 0.15;     // Add some randomness to simulations

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
      
      // Calculate base power from total points
      const basePower = (team.total_points || 0) * BASE_POWER_MULTIPLIER;
      
      // Get activity multiplier (default to 'active' if not specified)
      const activityLevel = (team.activity_level || 'active').toLowerCase();
      const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.active;
      
      teamData[team.team] = {
        power: Math.max(basePower, MIN_POWER),  // Ensure minimum power
        activity: activityMultiplier,
        group: team.group || 'DefaultGroup',
        pointDifferential: team.point_differential || 0,
        originalData: team
      };
      
      console.log(`Team ${team.team} - Power: ${teamData[team.team].power}, Activity: ${activityLevel}`);
    }
    
    return teamData;
  }

  prepareMatches(schedule) {
    const matches = [];
    
    for (const match of schedule) {
      if (!match.homeTeam || !match.awayTeam) continue;
      
      // Check if match is completed (has a series winner or games played)
      const hasPlayedGames = match.games && match.games.some(g => g.homeScore > 0 || g.awayScore > 0);
      const isCompleted = match.seriesWinner && match.seriesWinner !== 'N/A' || hasPlayedGames;
      
      // Calculate scores from games
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
        group: 'DefaultGroup',
        completed: isCompleted,
        originalData: match
      });
    }
    
    return matches;
  }

  getAdjustedPower(teamName) {
    const team = this.teamData[teamName];
    if (!team) return MIN_POWER;
    
    // Base power adjusted by activity level
    let adjustedPower = team.power * (1 + team.activity);
    
    // Add some randomness (up to ±RANDOMNESS_FACTOR%)
    const randomness = 1 + (Math.random() * 2 - 1) * RANDOMNESS_FACTOR;
    adjustedPower *= randomness;
    
    return Math.max(adjustedPower, MIN_POWER);
  }

  simulateGame(teamA, teamB) {
    const aPower = this.getAdjustedPower(teamA);
    const bPower = this.getAdjustedPower(teamB);
    const total = aPower + bPower;
    const roll = Math.random() * total;
    
    console.log(`Simulating ${teamA} (${aPower.toFixed(2)}) vs ${teamB} (${bPower.toFixed(2)}) - Roll: ${roll.toFixed(2)}`);
    
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
        points: team.total_points || 0,
        wins: 0,
        losses: 0,
        roundWins: 0,
        roundLosses: 0,
        pointDifferential: team.point_differential || 0,
        headToHead: {} // Track head-to-head results for tiebreakers
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
        console.log(`\nSimulating match: ${match.team1} vs ${match.team2}`);
        
        // Simulate a best of 3 series
        let score1 = 0, score2 = 0;
        while (score1 < 2 && score2 < 2) {
          const winner = this.simulateGame(match.team1, match.team2);
          if (winner === match.team1) score1++;
          else score2++;
        }
        
        console.log(`Simulated result: ${match.team1} ${score1}-${score2} ${match.team2}`);
        
        const simulatedMatch = {
          ...match,
          score1: score1,
          score2: score2,
          completed: true
        };
        
        this.updateStandings(results, simulatedMatch);
      }
    }

    // Sort each group with tiebreakers
    this.applyTiebreakers(results);

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
      
      // Record head-to-head result
      team1Standing.headToHead[team2] = (team1Standing.headToHead[team2] || 0) + 1;
    } else if (score2 > score1) {
      team2Standing.wins++;
      team1Standing.losses++;
      team2Standing.points += 3;
      
      // Record head-to-head result
      team2Standing.headToHead[team1] = (team2Standing.headToHead[team1] || 0) + 1;
    } else {
      // In case of a draw (shouldn't happen in BO3, but just in case)
      team1Standing.points += 1;
      team2Standing.points += 1;
    }

    // Update point differential
    team1Standing.pointDifferential += (score1 - score2);
    team2Standing.pointDifferential += (score2 - score1);
  }

  applyTiebreakers(standings) {
    for (const [group, teams] of Object.entries(standings)) {
      // First sort by points (descending)
      teams.sort((a, b) => b.points - a.points);
      
      // Group teams with the same number of points
      const groups = [];
      let currentGroup = [teams[0]];
      
      for (let i = 1; i < teams.length; i++) {
        if (teams[i].points === currentGroup[0].points) {
          currentGroup.push(teams[i]);
        } else {
          if (currentGroup.length > 1) {
            this.breakTies(currentGroup);
          }
          currentGroup = [teams[i]];
        }
      }
      
      // Handle the last group
      if (currentGroup.length > 1) {
        this.breakTies(currentGroup);
      }
      
      // Rebuild the sorted array
      let index = 0;
      for (const group of groups) {
        for (const team of group) {
          teams[index++] = team;
        }
      }
    }
  }
  
  breakTies(teams) {
    if (teams.length < 2) return;
    
    // 1. Head-to-head results
    const headToHeadResults = {};
    let hasHeadToHead = false;
    
    for (const team of teams) {
      headToHeadResults[team.team] = 0;
      for (const opponent of teams) {
        if (team.team !== opponent.team && team.headToHead[opponent.team]) {
          headToHeadResults[team.team] += team.headToHead[opponent.team];
          hasHeadToHead = true;
        }
      }
    }
    
    if (hasHeadToHead) {
      teams.sort((a, b) => headToHeadResults[b.team] - headToHeadResults[a.team]);
      return;
    }
    
    // 2. Point differential
    teams.sort((a, b) => b.pointDifferential - a.pointDifferential);
    
    // 3. If still tied, use a coin flip (random sort)
    if (teams.length > 1 && teams[0].pointDifferential === teams[1].pointDifferential) {
      for (let i = teams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teams[i], teams[j]] = [teams[j], teams[i]];
      }
    }
  }
}

module.exports = {
  RT25KSimulator
};
