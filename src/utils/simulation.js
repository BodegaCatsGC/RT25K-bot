// src/utils/simulation.js

// Activity level configuration
const ACTIVITY_LEVELS = {
  active: {
    minGames: 5,    // Teams with 5+ games are considered active
    multiplier: 1.0  // Full boost for active teams
  },
  partial: {
    minGames: 2,    // Teams with 2-4 games are partially active
    multiplier: 0.5  // Half boost for partially active teams
  },
  inactive: {
    minGames: 0,    // Teams with 0-1 games are inactive
    multiplier: 0.1  // Minimal boost for inactive teams
  }
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
    if (!standings || !Array.isArray(standings)) {
      throw new Error('Standings must be a non-empty array');
    }
    
    if (!schedule || !Array.isArray(schedule)) {
      console.warn('No schedule provided or invalid schedule format, using empty array');
      schedule = [];
    }
    
    this.standings = standings;
    this.schedule = schedule;
    this.teamData = this.prepareTeamData(standings);
    this.matches = this.prepareMatches(schedule);
    
    // Calculate games played for each team
    this.calculateGamesPlayed();
    
    console.log(`Simulator initialized with ${Object.keys(this.teamData).length} teams and ${this.matches.length} matches`);
  }

  /**
   * Calculate how many games each team has played
   */
  calculateGamesPlayed() {
    // Reset game counts
    Object.values(this.teamData).forEach(team => {
      team.gamesPlayed = 0;
    });
    
    // Count games for each team
    for (const match of this.matches) {
      if (match.completed) {
        const team1 = this.teamData[match.team1];
        const team2 = this.teamData[match.team2];
        
        if (team1) team1.gamesPlayed += match.score1 + match.score2;
        if (team2) team2.gamesPlayed += match.score1 + match.score2;
      }
    }
    
    // Log game counts for debugging
    Object.entries(this.teamData).forEach(([teamName, team]) => {
      console.log(`Team ${teamName} has played ${team.gamesPlayed} games`);
    });
    
    // Update activity levels and power based on games played
    Object.entries(this.teamData).forEach(([teamName, team]) => {
      team.activity = this.getActivityLevel(team.gamesPlayed);
      team.power = Math.max(
        MIN_POWER,
        (Number(team.points) || 0) * BASE_POWER_MULTIPLIER * ACTIVITY_LEVELS[team.activity].multiplier
      );
    });
  }

  /**
   * Determine activity level based on games played
   */
  getActivityLevel(gamesPlayed) {
    if (gamesPlayed >= ACTIVITY_LEVELS.active.minGames) {
      return 'active';
    } else if (gamesPlayed >= ACTIVITY_LEVELS.partial.minGames) {
      return 'partial';
    } else {
      return 'inactive';
    }
  }

  prepareTeamData(standings) {
    const teamData = {};
    
    console.log('Preparing team data from standings:', standings);
    
    for (const team of standings) {
      try {
        if (!team || !team.team) {
          console.warn('Skipping invalid team entry:', team);
          continue;
        }
        
        const points = Number(team.total_points) || 0;
        const gamesPlayed = Number(team.games_played) || 0;
        
        teamData[team.team] = {
          name: team.team,
          group: team.group || 'DefaultGroup',
          points: points,
          gamesPlayed: gamesPlayed,
          wins: 0,
          losses: 0,
          roundWins: 0,
          roundLosses: 0,
          pointDifferential: 0,
          headToHead: {}
        };
        
        console.log(`Added team: ${team.team} (${team.group || 'No Group'}) - ` +
                    `${points} pts, ${gamesPlayed} games, ` +
                    `activity: ${teamData[team.team].activity}`);
      } catch (error) {
        console.error('Error processing team:', team, error);
      }
    }
    
    console.log(`Team data prepared. Total teams: ${Object.keys(teamData).length}`);
    return teamData;
  }

  prepareMatches(schedule) {
    const matches = [];
    
    if (!schedule || !Array.isArray(schedule)) {
      console.warn('Invalid schedule data in prepareMatches, using empty array');
      return matches;
    }
    
    console.log(`Preparing ${schedule.length} matches`);
    
    for (const match of schedule) {
      try {
        if (!match || !match.homeTeam || !match.awayTeam) {
          console.warn('Skipping invalid match:', match);
          continue;
        }
        
        // Check if the match is completed (has a winner or any games played)
        const hasPlayedGames = match.games && match.games.some(g => g.homeScore > 0 || g.awayScore > 0);
        const isCompleted = match.seriesWinner && match.seriesWinner !== 'N/A' || hasPlayedGames;
        
        // Calculate total scores from games (if any)
        let score1 = 0;
        let score2 = 0;
        
        if (match.games && Array.isArray(match.games)) {
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
        
      } catch (error) {
        console.error('Error processing match:', match, error);
      }
    }
    
    console.log(`Prepared ${matches.length} valid matches (${matches.filter(m => !m.completed).length} remaining to simulate)`);
    return matches;
  }

  getAdjustedPower(teamName) {
    const team = this.teamData[teamName];
    if (!team) {
      console.warn(`Team ${teamName} not found in team data`);
      return MIN_POWER;
    }
    
    // Base power from points (ensure it's a number)
    const points = Number(team.points) || 0;
    let basePower = points * BASE_POWER_MULTIPLIER;
    
    // Ensure base power is at least MIN_POWER
    basePower = Math.max(MIN_POWER, basePower);
    
    // Get activity level based on games played
    const activityLevel = this.getActivityLevel(team.gamesPlayed || 0);
    const activityMultiplier = ACTIVITY_LEVELS[activityLevel]?.multiplier || 0.1;
    
    // Apply activity multiplier
    let adjustedPower = basePower * activityMultiplier;
    
    // Add some randomness (up to ±15%)
    const randomness = 1 + (Math.random() * 2 - 1) * RANDOMNESS_FACTOR;
    adjustedPower = adjustedPower * randomness;
    
    // Ensure power is within bounds
    adjustedPower = Math.max(MIN_POWER, Math.min(1.0, adjustedPower));
    
    console.log(`Team ${teamName}: ${points} pts, ${team.gamesPlayed || 0} games, ` +
                `activity: ${activityLevel} (x${activityMultiplier}), ` +
                `base: ${basePower.toFixed(2)}, final: ${adjustedPower.toFixed(2)}`);
    
    return adjustedPower;
  }

  simulateGame(teamA, teamB) {
    const aPower = this.getAdjustedPower(teamA);
    const bPower = this.getAdjustedPower(teamB);
    const total = aPower + bPower;
    
    // Ensure we have valid power values
    if (total <= 0) {
      console.warn(`Invalid power values: ${teamA}=${aPower}, ${teamB}=${bPower}. Using equal chances.`);
      return Math.random() < 0.5 ? teamA : teamB;
    }
    
    const roll = Math.random() * total;
    const winner = roll < aPower ? teamA : teamB;
    
    console.log(`Simulating ${teamA} (${aPower.toFixed(2)}) vs ${teamB} (${bPower.toFixed(2)}) - Roll: ${roll.toFixed(2)} - Winner: ${winner}`);
    
    return winner;
  }

  simulateSeries(team1, team2) {
    let score1 = 0;
    let score2 = 0;
    
    // Simulate games until one team gets 2 wins
    while (score1 < 2 && score2 < 2) {
      const winner = this.simulateGame(team1, team2);
      
      if (winner === team1) {
        score1++;
      } else {
        score2++;
      }
      
      console.log(`Game ${score1 + score2}: ${team1} ${score1}-${score2} ${team2}`);
    }
    
    return { score1, score2 };
  }

  simulateRemainingMatches() {
    const simulatedMatches = [];
    
    // Process each match in the schedule
    for (const match of this.matches) {
      if (match.completed) continue;
      
      const { team1, team2 } = match;
      
      // Ensure both teams exist in our data
      if (!this.teamData[team1] || !this.teamData[team2]) {
        console.warn(`Skipping match - one or both teams not found: ${team1} vs ${team2}`);
        continue;
      }
      
      console.log(`\n=== Simulating ${team1} vs ${team2} ===`);
      
      // Simulate the best-of-3 series
      const { score1, score2 } = this.simulateSeries(team1, team2);
      
      // Mark the match as completed with the simulated scores
      match.completed = true;
      match.score1 = score1;
      match.score2 = score2;
      
      // Calculate points based on series result
      let team1Points = 0;
      let team2Points = 0;
      
      if (score1 === 2 && score2 === 0) {
        // Team 1 wins 2-0 (sweep)
        team1Points = this.constructor.POINTS_SWEEP_WIN;  // 75 points
        team2Points = this.constructor.POINTS_SWEEP_LOSS;  // 45 points
      } else if (score1 === 0 && score2 === 2) {
        // Team 2 wins 2-0 (sweep)
        team1Points = this.constructor.POINTS_SWEEP_LOSS;  // 45 points
        team2Points = this.constructor.POINTS_SWEEP_WIN;   // 75 points
      } else if (score1 === 2 && score2 === 1) {
        // Team 1 wins 2-1
        team1Points = this.constructor.POINTS_WIN * 2 + this.constructor.POINTS_LOSS;  // 2 wins + 1 loss = 65 points
        team2Points = this.constructor.POINTS_WIN + this.constructor.POINTS_LOSS * 2;  // 1 win + 2 losses = 55 points
      } else if (score1 === 1 && score2 === 2) {
        // Team 2 wins 2-1
        team1Points = this.constructor.POINTS_WIN + this.constructor.POINTS_LOSS * 2;  // 1 win + 2 losses = 55 points
        team2Points = this.constructor.POINTS_WIN * 2 + this.constructor.POINTS_LOSS;  // 2 wins + 1 loss = 65 points
      }
      
      // Update the match with points
      match.team1Points = team1Points;
      match.team2Points = team2Points;
      
      console.log(`Series result: ${team1} ${score1}-${score2} ${team2} (${team1Points}-${team2Points} pts)`);
      
      // Add to simulated matches
      simulatedMatches.push({
        team1,
        team2,
        score1,
        score2,
        team1Points,
        team2Points,
        isSweep: score1 === 0 || score2 === 0
      });
      
      // Update standings with the match result
      this.updateStandings(this.standings, match);
    }
    
    // Apply tiebreakers to all groups
    for (const [group, teams] of Object.entries(this.standings)) {
      this.standings[group] = this.applyTiebreakers(teams);
    }
    
    return {
      standings: this.standings,
      simulatedMatches
    };
  }

  updateStandings(standings, match) {
    if (!match.completed) return;
    
    const { team1, team2, score1, score2 } = match;
    
    // Find teams in their respective groups
    const findTeamInStandings = (teamName) => {
      for (const group of Object.values(standings)) {
        const team = group.find(t => t.team === teamName);
        if (team) return team;
      }
      console.warn(`Team not found in any group: ${teamName}`);
      return null;
    };
    
    const team1Standing = findTeamInStandings(team1);
    const team2Standing = findTeamInStandings(team2);
    
    if (!team1Standing || !team2Standing) {
      console.warn(`Could not update standings for match: ${team1} vs ${team2}`);
      return;
    }
    
    // Store previous points for logging
    const team1PrevPoints = team1Standing.points;
    const team2PrevPoints = team2Standing.points;
    
    // Update wins/losses and points based on series result
    if (score1 > score2) {
      // Team 1 wins the series
      team1Standing.wins++;
      team2Standing.losses++;
      
      // Add points: 25 for win, 15 for loss
      team1Standing.points += this.constructor.POINTS_WIN;
      team2Standing.points += this.constructor.POINTS_LOSS;
      
      // Update head-to-head
      team1Standing.headToHead[team2] = (team1Standing.headToHead[team2] || 0) + 1;
    } else {
      // Team 2 wins the series
      team2Standing.wins++;
      team1Standing.losses++;
      
      // Add points: 25 for win, 15 for loss
      team2Standing.points += this.constructor.POINTS_WIN;
      team1Standing.points += this.constructor.POINTS_LOSS;
      
      // Update head-to-head
      team2Standing.headToHead[team1] = (team2Standing.headToHead[team1] || 0) + 1;
    }
    
    // Update round wins/losses and point differential
    team1Standing.roundWins += score1;
    team1Standing.roundLosses += score2;
    team2Standing.roundWins += score2;
    team2Standing.roundLosses += score1;
    
    // Update point differential (round wins - round losses)
    team1Standing.pointDifferential = team1Standing.roundWins - team1Standing.roundLosses;
    team2Standing.pointDifferential = team2Standing.roundWins - team2Standing.roundLosses;
    
    // Log the point changes
    console.log(`\n=== Match: ${team1} ${score1}-${score2} ${team2} ===`);
    console.log(`${team1}: ${team1PrevPoints} -> ${team1Standing.points} pts ` +
                `(+${team1Standing.points - team1PrevPoints})`);
    console.log(`${team2}: ${team2PrevPoints} -> ${team2Standing.points} pts ` +
                `(+${team2Standing.points - team2PrevPoints})`);
    
    // Update the team data with new points for power calculations
    if (this.teamData[team1]) {
      this.teamData[team1].points = team1Standing.points;
      this.teamData[team1].gamesPlayed = team1Standing.wins + team1Standing.losses;
    }
    if (this.teamData[team2]) {
      this.teamData[team2].points = team2Standing.points;
      this.teamData[team2].gamesPlayed = team2Standing.wins + team2Standing.losses;
    }
  }

  applyTiebreakers(teams) {
    console.log('Applying tiebreakers to group with teams:', teams.map(t => t.team).join(', '));
    
    if (!teams || !Array.isArray(teams)) {
      console.error('Invalid teams data in applyTiebreakers:', teams);
      return [];
    }

    // First, sort by points (primary)
    teams.sort((a, b) => (b.points || 0) - (a.points || 0));
    
    // Group teams by points
    const grouped = {};
    teams.forEach(team => {
      const points = team.points || 0;
      if (!grouped[points]) {
        grouped[points] = [];
      }
      grouped[points].push(team);
    });
    
    // Process each group of teams with the same points
    const result = [];
    for (const [points, tiedTeams] of Object.entries(grouped)) {
      if (tiedTeams.length === 1) {
        result.push(...tiedTeams);
        continue;
      }
      
      console.log(`Breaking tie between: ${tiedTeams.map(t => t.team).join(', ')}`);
      
      // Apply tiebreakers
      // 1. Head-to-head
      const headToHeadSorted = [...tiedTeams].sort((a, b) => {
        const aWins = a.headToHead[b.team] || 0;
        const bWins = b.headToHead[a.team] || 0;
        return bWins - aWins; // More wins is better
      });
      
      // 2. Point differential
      const pdSorted = [...headToHeadSorted].sort((a, b) => 
        (b.pointDifferential || 0) - (a.pointDifferential || 0)
      );
      
      // 3. Random (if still tied)
      const finalSorted = [...pdSorted].sort(() => Math.random() - 0.5);
      
      result.push(...finalSorted);
    }
    
    return result;
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

  static get POINTS_WIN() { return 25; }
  static get POINTS_LOSS() { return 15; }
  static get POINTS_SWEEP_WIN() { return 75; }
  static get POINTS_SWEEP_LOSS() { return 45; }
}

module.exports = {
  RT25KSimulator
};
