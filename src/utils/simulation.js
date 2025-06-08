// src/utils/simulation.js

// Activity level configuration
const ACTIVITY_LEVELS = {
  active: {
    minGames: 5,    // Teams with 5+ games are considered active
    multiplier: 1.2   // Increased from 1.0 to 1.2 (20% boost for active teams)
  },
  partial: {
    minGames: 3,    // Teams with 3-4 games are partially active
    multiplier: 0.6  // Increased from 0.5 to 0.6 (slight boost for partially active teams)
  },
  inactive: {
    minGames: 0,    // Teams with 0-2 games are inactive
    multiplier: 0.05 // Reduced from 0.1 to 0.05 (halved for inactive teams)
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
      team.activity = this.getActivityLevel(teamName);
      team.power = Math.max(
        MIN_POWER,
        (Number(team.points) || 0) * BASE_POWER_MULTIPLIER * ACTIVITY_LEVELS[team.activity].multiplier
      );
    });
  }

  /**
   * Determine activity level based on games played
   */
  getActivityLevel(teamName) {
    const team = this.teamData[teamName];
    if (!team) {
      console.warn(`Team not found in teamData: ${teamName}`);
      return 'inactive';
    }
    
    // Use the pre-calculated activity level if available
    if (team.activity) {
      return team.activity;
    }
    
    // Fallback to calculating based on games played
    const gamesPlayed = team.gamesPlayed || 0;
    
    if (gamesPlayed >= 5) return 'active';      // 5+ games: Active
    if (gamesPlayed >= 3) return 'partial';     // 3-4 games: Partial
    return 'inactive';                          // 0-2 games: Inactive
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
    console.log('Preparing matches from schedule...');
    const matches = [];
    
    for (const match of schedule) {
      try {
        let score1 = 0;
        let score2 = 0;
        let isCompleted = false;
        
        // Check if we have a seriesScore (e.g., "1-1", "2-0")
        if (match.seriesScore) {
          console.log(`Processing match with seriesScore: ${match.seriesScore}`);
          const [s1, s2] = match.seriesScore.split('-').map(Number);
          if (!isNaN(s1) && !isNaN(s2)) {
            score1 = s1;
            score2 = s2;
            isCompleted = score1 >= 2 || score2 >= 2;
            console.log(`  Parsed scores: ${score1}-${score2}, completed: ${isCompleted}`);
          }
        } 
        // Fallback to calculating from games array if seriesScore is not available
        else if (match.games && Array.isArray(match.games)) {
          console.log('Processing match with games array');
          match.games.forEach(game => {
            if (game.homeScore > game.awayScore) score1++;
            else if (game.awayScore > game.homeScore) score2++;
          });
          isCompleted = score1 >= 2 || score2 >= 2 || 
                       (score1 + score2) >= 3; // All 3 games played
        }
        
        // If seriesWinner is set, mark as completed
        if (match.seriesWinner && match.seriesWinner !== '1-1') {
          isCompleted = true;
          console.log(`  Match marked as completed by seriesWinner: ${match.seriesWinner}`);
        }
        
        matches.push({
          team1: match.homeTeam,
          team2: match.awayTeam,
          score1,
          score2,
          completed: isCompleted,
          originalData: match
        });
        
        console.log(`  Added match: ${match.homeTeam} ${score1}-${score2} ${match.awayTeam} (${isCompleted ? 'completed' : 'incomplete'})`);
      } catch (error) {
        console.error('Error processing match:', error);
        console.error('Match data:', JSON.stringify(match, null, 2));
      }
    }
    
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
    const activityLevel = this.getActivityLevel(teamName);
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
    console.log('Starting simulation of remaining matches...');
    const simulatedMatches = [];
    
    // Process each match in the schedule
    for (const match of this.matches) {
      try {
        if (match.completed) {
          console.log(`Skipping completed match: ${match.team1} ${match.score1}-${match.score2} ${match.team2}`);
          continue;
        }
        
        const { team1, team2 } = match;
        let { score1 = 0, score2 = 0 } = match;
        
        // Ensure both teams exist in our data
        if (!this.teamData[team1] || !this.teamData[team2]) {
          console.warn(`Skipping match - one or both teams not found: ${team1} vs ${team2}`);
          continue;
        }
        
        console.log(`\n=== Simulating ${team1} (${score1}) vs ${team2} (${score2}) ===`);
        
        // If series is already completed, skip it (shouldn't happen due to the completed check above)
        if (score1 >= 2 || score2 >= 2) {
          console.log(`Series already completed: ${team1} ${score1}-${score2} ${team2}`);
          match.completed = true;
          continue;
        }
        
        console.log(`Simulating remaining games in series (current: ${score1}-${score2})`);
        
        // Simulate remaining games until one team gets 2 wins
        while (score1 < 2 && score2 < 2 && (score1 + score2) < 3) {
          const winner = this.simulateGame(team1, team2);
          
          if (winner === team1) {
            score1++;
          } else {
            score2++;
          }
          
          console.log(`Game ${score1 + score2}: ${team1} ${score1}-${score2} ${team2}`);
          
          // If we've reached the maximum number of games (3), stop
          if (score1 + score2 >= 3) {
            break;
          }
        }
        
        // Ensure we have a valid winner (best of 3)
        if (score1 === score2) {
          // This shouldn't happen in a best-of-3, but just in case
          console.warn(`Series ended in a tie: ${team1} ${score1}-${score2} ${team2}, simulating tiebreaker`);
          const winner = this.simulateGame(team1, team2);
          if (winner === team1) score1++;
          else score2++;
        }
        
        // Calculate points based on the final series result
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
        
        // Update the match with the final scores and points
        match.score1 = score1;
        match.score2 = score2;
        match.team1Points = team1Points;
        match.team2Points = team2Points;
        match.completed = true;
        
        console.log(`Series result: ${team1} ${score1}-${score2} ${team2} (${team1Points}-${team2Points} pts)`);
        
        // Add to simulated matches
        simulatedMatches.push({
          team1,
          team2,
          score1,
          score2,
          team1Points,
          team2Points,
          isSweep: (score1 === 2 && score2 === 0) || (score1 === 0 && score2 === 2)
        });
        
        // Update standings with the match result
        this.updateStandings(this.standings, match);
        
      } catch (error) {
        console.error(`Error simulating match ${match.team1} vs ${match.team2}:`, error);
      }
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
    if (!match || !match.completed) return;
    
    const { team1, team2, score1, score2 } = match;
    
    // Find teams in the standings
    const team1Standing = this.findTeamInStandings(team1, standings);
    const team2Standing = this.findTeamInStandings(team2, standings);
    
    if (!team1Standing || !team2Standing) {
      console.warn(`Could not update standings for match: ${team1} vs ${team2}`);
      return;
    }
    
    // Initialize headToHead objects if they don't exist
    team1Standing.headToHead = team1Standing.headToHead || {};
    team2Standing.headToHead = team2Standing.headToHead || {};
    
    // Store previous points for logging
    const team1PrevPoints = team1Standing.points || 0;
    const team2PrevPoints = team2Standing.points || 0;
    
    // Initialize points if they don't exist
    team1Standing.points = team1Standing.points || 0;
    team2Standing.points = team2Standing.points || 0;
    
    // Update wins/losses and points based on series result
    if (score1 > score2) {
      // Team 1 wins the series
      team1Standing.wins = (team1Standing.wins || 0) + 1;
      team2Standing.losses = (team2Standing.losses || 0) + 1;
      
      // Add points based on series result
      if (score2 === 0) {
        // 2-0 sweep
        team1Standing.points += this.constructor.POINTS_SWEEP_WIN;
        team2Standing.points += this.constructor.POINTS_SWEEP_LOSS;
      } else {
        // 2-1 result
        team1Standing.points += this.constructor.POINTS_WIN * 2 + this.constructor.POINTS_LOSS;
        team2Standing.points += this.constructor.POINTS_WIN + this.constructor.POINTS_LOSS * 2;
      }
      
      // Update head-to-head
      team1Standing.headToHead[team2] = (team1Standing.headToHead[team2] || 0) + 1;
    } else {
      // Team 2 wins the series
      team2Standing.wins = (team2Standing.wins || 0) + 1;
      team1Standing.losses = (team1Standing.losses || 0) + 1;
      
      // Add points based on series result
      if (score1 === 0) {
        // 0-2 sweep
        team1Standing.points += this.constructor.POINTS_SWEEP_LOSS;
        team2Standing.points += this.constructor.POINTS_SWEEP_WIN;
      } else {
        // 1-2 result
        team1Standing.points += this.constructor.POINTS_WIN + this.constructor.POINTS_LOSS * 2;
        team2Standing.points += this.constructor.POINTS_WIN * 2 + this.constructor.POINTS_LOSS;
      }
      
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

  // Helper function to find a team in the standings
  findTeamInStandings(teamName, standings) {
    // If standings is an array, it's a flat list of teams
    if (Array.isArray(standings)) {
      return standings.find(team => team.team === teamName);
    }
    
    // If standings is an object with group arrays, search through all groups
    for (const group of Object.values(standings)) {
      if (Array.isArray(group)) {
        const team = group.find(t => t.team === teamName);
        if (team) return team;
      }
    }
    
    console.warn(`Team not found in any group: ${teamName}`);
    return null;
  }

  applyTiebreakers(teams) {
    // Ensure teams is an array
    if (!Array.isArray(teams)) {
      console.warn('applyTiebreakers called with non-array input:', teams);
      return [];
    }

    // If there's only one team, return it as is
    if (teams.length <= 1) {
      return [...teams];
    }

    console.log('Applying tiebreakers to group with teams:', teams.map(t => t.team).join(', '));
    
    // 1. First sort by Total Points (descending)
    const sorted = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
    
    // Group teams by points
    const groups = [];
    let currentGroup = [];
    let currentPoints = null;
    
    for (const team of sorted) {
      if (team.points !== currentPoints) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [team];
        currentPoints = team.points;
      } else {
        currentGroup.push(team);
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    // Apply tiebreakers to each group
    const result = [];
    
    for (const group of groups) {
      if (group.length === 1) {
        result.push(...group);
        continue;
      }
      
      console.log(`Breaking tie for teams with ${group[0].points} points:`, group.map(t => t.team).join(', '));
      
      // 2. Sort by Head-to-Head results
      group.sort((a, b) => {
        // Check direct head-to-head
        const aWins = a.headToHead?.[b.team] || 0;
        const bWins = b.headToHead?.[a.team] || 0;
        
        if (aWins !== bWins) {
          return bWins - aWins; // More wins comes first
        }
        
        // 3. If still tied, sort by Point Differential
        const aDiff = a.pointDifferential || 0;
        const bDiff = b.pointDifferential || 0;
        
        if (aDiff !== bDiff) {
          return bDiff - aDiff; // Higher differential comes first
        }
        
        // 4. If still tied, simulate a tiebreak game
        const aPower = this.getAdjustedPower(a);
        const bPower = this.getAdjustedPower(b);
        return bPower - aPower; // Higher power comes first
      });
      
      // Log the final order after all tiebreakers
      console.log('Final order after tiebreakers:', group.map(t => t.team).join(' > '));
      result.push(...group);
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
