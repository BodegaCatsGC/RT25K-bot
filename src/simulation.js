// src/simulation.js

// Interfaces for type documentation
/**
 * @typedef {Object} TeamData
 * @property {number} power
 * @property {number} activity
 * @property {string} group
 * @property {number} gamesPlayed
 */

/**
 * @typedef {Object} MatchResult
 * @property {string} team1
 * @property {string} team2
 * @property {number} score1
 * @property {number} score2
 * @property {string} group
 */

/**
 * @typedef {Object} TeamStanding
 * @property {string} team
 * @property {number} points
 * @property {number} matchesPlayed
 * @property {number} wins
 * @property {number} losses
 * @property {number} mapDiff
 * @property {number} roundWins
 * @property {number} roundLosses
 * @property {number} gamesPlayed
 */

/**
 * @typedef {Object.<string, TeamStanding[]>} SimulationResult
 */

const DEFAULT_BOOST_FACTOR = 0.2;
const DEFAULT_BEST_OF_SERIES = 5;
const GAMES_FOR_MAX_BOOST = 5; // Number of games needed for maximum boost
const MAX_BOOST_MULTIPLIER = 2.0; // Maximum boost multiplier (2.0 = 2x power)

class RT25KSimulator {
    /**
     * @param {Array} standings - Array of team standings
     * @param {Array} schedule - Array of matches
     */
    constructor(standings, schedule) {
        if (!standings || !Array.isArray(standings)) {
            throw new Error('Standings must be a non-empty array');
        }
        
        if (!schedule || !Array.isArray(schedule)) {
            console.warn('No schedule provided or invalid schedule format, using empty array');
            schedule = [];
        }
        
        /** @type {Object.<string, TeamData>} */
        this.teamData = this.prepareTeamData(standings);
        this.matches = this.prepareMatches(schedule);
        
        // Calculate games played for each team from matches
        this.calculateGamesPlayed();
        
        console.log(`Simulator initialized with ${Object.keys(this.teamData).length} teams and ${this.matches.length} matches`);
    }

    /**
     * @param {Array} standings - Array of team standings
     * @returns {Object.<string, TeamData>}
     */
    prepareTeamData(standings) {
        const teamData = {};
        
        standings.forEach(standing => {
            const teamName = standing.team;
            if (!teamName) return;
            
            teamData[teamName] = {
                power: standing.power || 0,
                activity: standing.activity || 0,
                group: standing.group || 'DefaultGroup',
                gamesPlayed: standing.gamesPlayed || 0
            };
        });
        
        return teamData;
    }

    /**
     * @param {Array} schedule - Array of matches
     * @returns {MatchResult[]}
     */
    prepareMatches(schedule) {
        const matches = [];
        
        schedule.forEach(match => {
            if (!match.team1 || !match.team2) return;
            
            matches.push({
                team1: match.team1,
                team2: match.team2,
                score1: match.score1 || 0,
                score2: match.score2 || 0,
                group: match.group || 'DefaultGroup'
            });
        });
        
        return matches;
    }

    /**
     * Calculate games played for each team from matches
     */
    calculateGamesPlayed() {
        const gamesPlayed = {};
        
        this.matches.forEach(match => {
            if (match.score1 >= 0 && match.score2 >= 0) {
                gamesPlayed[match.team1] = (gamesPlayed[match.team1] || 0) + 1;
                gamesPlayed[match.team2] = (gamesPlayed[match.team2] || 0) + 1;
            }
        });
        
        this.gamesPlayed = gamesPlayed;
    }

    /**
     * @param {string} teamName
     * @returns {{basePower: number, activityBoost: number, finalPower: number, gamesPlayed: number}}
     */
    getAdjustedPower(teamName) {
        const team = this.teamData[teamName];
        if (!team) {
            return {
                basePower: 0,
                activityBoost: 0,
                finalPower: 0,
                gamesPlayed: 0
            };
        }

        const basePower = team.power;
        const gamesPlayed = team.gamesPlayed || 0;
        const activityFactor = Math.min(gamesPlayed / GAMES_FOR_MAX_BOOST, 1.0);
        const activityBoost = activityFactor * team.activity * DEFAULT_BOOST_FACTOR;
        const finalPower = basePower * (1 + activityBoost);

        return {
            basePower,
            activityBoost,
            finalPower,
            gamesPlayed
        };
    }

    /**
     * @param {string} teamA
     * @param {string} teamB
     * @returns {{winner: string, scoreA: number, scoreB: number, gameScores: Array<{winner: string, loser: string}>, details: {teamA: {power: number, activity: number, games: number}, teamB: {power: number, activity: number, games: number}}}}
     */
    simulateGame(teamA, teamB) {
        const aPower = this.getAdjustedPower(teamA);
        const bPower = this.getAdjustedPower(teamB);
        const total = aPower.finalPower + bPower.finalPower;
        const roll = Math.random() * total;
        const winner = roll < aPower.finalPower ? teamA : teamB;
        
        return {
            winner,
            scoreA: winner === teamA ? 1 : 0,
            scoreB: winner === teamB ? 1 : 0,
            gameScores: [{ winner, loser: winner === teamA ? teamB : teamA }],
            details: {
                teamA: {
                    power: aPower.basePower,
                    activity: this.teamData[teamA]?.activity || 0,
                    games: aPower.gamesPlayed,
                    finalPower: aPower.finalPower.toFixed(2)
                },
                teamB: {
                    power: bPower.basePower,
                    activity: this.teamData[teamB]?.activity || 0,
                    games: bPower.gamesPlayed,
                    finalPower: bPower.finalPower.toFixed(2)
                }
            }
        };
    }

    /**
     * @param {string} teamA
     * @param {string} teamB
     * @returns {{winner: string, scoreA: number, scoreB: number, gameScores: Array<{winner: string, loser: string}>}}
     */
    simulateSeries(teamA, teamB) {
        let scoreA = 0;
        let scoreB = 0;
        const gameScores = [];
        const requiredWins = Math.ceil(DEFAULT_BEST_OF_SERIES / 2);

        while (scoreA < requiredWins && scoreB < requiredWins) {
            const { winner, score1, score2, gameScores: gameScore } = this.simulateGame(teamA, teamB);
            if (winner === teamA) {
                scoreA++;
                gameScores.push(...gameScore);
            } else {
                scoreB++;
                gameScores.push(...gameScore);
            }
        }

        return {
            winner: scoreA > scoreB ? teamA : teamB,
            scoreA,
            scoreB,
            gameScores
        };
    }

    /**
     * @returns {{standings: SimulationResult, simulatedMatches: Array<{team1: string, team2: string, score1: number, score2: number, gameScores: Array<{winner: string, loser: string}>}>}}
     */
    simulateRemainingMatches() {
        // Initialize games played count from existing matches
        this.calculateGamesPlayed();
        
        /** @type {SimulationResult} */
        const results = {};
        this.simulatedMatches = [];

        // Initialize group standings
        Object.entries(this.teamData).forEach(([teamName, data]) => {
            if (!results[data.group]) {
                results[data.group] = [];
            }
            
            results[data.group].push({
                team: teamName,
                points: 0,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                mapDiff: 0,
                roundWins: 0,
                roundLosses: 0,
                gamesPlayed: data.gamesPlayed || 0
            });
        });

        // Process played matches
        this.matches.forEach(match => {
            if (match.score1 >= 0 && match.score2 >= 0) {
                this.updateStandings(results, match);
            }
        });

        // Simulate remaining matches
        const teamNames = Object.keys(this.teamData);
        
        // Simulate round-robin matches between all teams in the same group
        for (const group of Object.keys(results)) {
            const groupTeams = results[group].map(t => t.team);
            
            for (let i = 0; i < groupTeams.length; i++) {
                for (let j = i + 1; j < groupTeams.length; j++) {
                    const teamA = groupTeams[i];
                    const teamB = groupTeams[j];
                    
                    // Check if this match has already been played
                    const matchPlayed = this.matches.some(m => 
                        ((m.team1 === teamA && m.team2 === teamB) || 
                         (m.team1 === teamB && m.team2 === teamA)) &&
                        m.score1 >= 0 && m.score2 >= 0
                    );
                    
                    if (!matchPlayed) {
                        const { winner, scoreA, scoreB, gameScores } = this.simulateSeries(teamA, teamB);
                        const simulatedMatch = {
                            team1: teamA,
                            team2: teamB,
                            score1: scoreA,
                            score2: scoreB,
                            gameScores,
                            group
                        };
                        this.simulatedMatches.push(simulatedMatch);
                        this.updateStandings(results, simulatedMatch);
                    }
                }
            }
        }

        // Sort each group by points, then map difference, then head-to-head
        Object.values(results).forEach(group => {
            group.sort((a, b) => {
                // Sort by points (descending)
                if (a.points !== b.points) return b.points - a.points;
                
                // Then by map difference (descending)
                const aDiff = a.roundWins - a.roundLosses;
                const bDiff = b.roundWins - b.roundLosses;
                if (aDiff !== bDiff) return bDiff - aDiff;
                
                // Then by head-to-head (if applicable)
                const headToHead = this.getHeadToHead(a.team, b.team, group.map(t => t.team));
                if (headToHead) {
                    return headToHead;
                }
                
                // Finally, by round wins (descending)
                return b.roundWins - a.roundWins;
            });
        });

        return { standings: results, simulatedMatches: this.simulatedMatches };
    }

    /**
     * @param {SimulationResult} standings
     * @param {MatchResult} match
     */
    updateStandings(standings, match) {
        const { team1, team2, score1, score2, group } = match;
        
        // Update games played count
        this.gamesPlayed[team1] = (this.gamesPlayed[team1] || 0) + 1;
        this.gamesPlayed[team2] = (this.gamesPlayed[team2] || 0) + 1;
        
        const groupStandings = standings[group];
        if (!groupStandings) return;

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
            team1Standing.points += 3; // 3 points for a win
        } else if (score2 > score1) {
            team2Standing.wins++;
            team1Standing.losses++;
            team2Standing.points += 3; // 3 points for a win
        } else {
            // Handle draw if applicable (though unlikely in best-of series)
            team1Standing.points += 1;
            team2Standing.points += 1;
        }
    }

    /**
     * @param {string} teamA
     * @param {string} teamB
     * @param {string[]} groupTeams
     * @returns {number | null}
     */
    getHeadToHead(teamA, teamB, groupTeams) {
        // Get all matches between these two teams (both played and simulated)
        const matches = [
            ...this.matches,
            ...(this.simulatedMatches || [])
        ].filter(match => 
            ((match.team1 === teamA && match.team2 === teamB) || 
             (match.team1 === teamB && match.team2 === teamA)) &&
            match.score1 >= 0 && match.score2 >= 0
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

        if (aPoints > bPoints) return -1; // teamA is higher
        if (bPoints > aPoints) return 1;  // teamB is higher
        return 0; // Still tied
    }
}

module.exports = {
    RT25KSimulator
};
