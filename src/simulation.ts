// src/simulation.ts

interface TeamData {
    power: number;
    activity: number;
    group: string;
}

interface MatchResult {
    team1: string;
    team2: string;
    score1: number;
    score2: number;
    group: string;
}

interface SimulationResult {
    [group: string]: Array<{
        team: string;
        points: number;
        matchesPlayed: number;
        wins: number;
        losses: number;
        mapDiff: number;
        roundWins: number;
        roundLosses: number;
    }>;
}

const DEFAULT_BOOST_FACTOR = 0.2;
const DEFAULT_BEST_OF_SERIES = 5;

export class RT25KSimulator {
    private teamData: Record<string, TeamData> = {};
    private matches: MatchResult[] = [];

    constructor(private googleSheets: any) {}

    async loadTeamData(sheetId: string, sheetName: string): Promise<void> {
        // Use your existing Google Sheets integration to load team data
        const doc = this.googleSheets.doc(sheetId);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[sheetName];
        const rows = await sheet.getRows();

        this.teamData = rows.reduce((acc: Record<string, TeamData>, row: any) => {
            const teamName = row.get('Team Name') || row.get('Team');
            if (!teamName) return acc;
            
            acc[teamName] = {
                power: parseFloat(row.get('Power') || '0'),
                activity: parseFloat(row.get('Activity') || '0'),
                group: row.get('Group') || 'DefaultGroup'
            };
            return acc;
        }, {});
    }

    async loadMatches(sheetId: string, sheetName: string): Promise<void> {
        // Use your existing Google Sheets integration to load match data
        const doc = this.googleSheets.doc(sheetId);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[sheetName];
        const rows = await sheet.getRows();

        this.matches = rows.map((row: any) => ({
            team1: row.get('team1'),
            team2: row.get('team2'),
            score1: parseInt(row.get('score1') || '0', 10),
            score2: parseInt(row.get('score2') || '0', 10),
            group: row.get('group') || 'DefaultGroup'
        })).filter((match: MatchResult) => match.team1 && match.team2);
    }

    private getAdjustedPower(teamName: string): number {
        const team = this.teamData[teamName];
        if (!team) return 0;
        return team.power * (1 + DEFAULT_BOOST_FACTOR * team.activity);
    }

    private simulateGame(teamA: string, teamB: string): string {
        const aPower = this.getAdjustedPower(teamA);
        const bPower = this.getAdjustedPower(teamB);
        const total = aPower + bPower;
        const roll = Math.random() * total;
        return roll < aPower ? teamA : teamB;
    }

    private simulateSeries(teamA: string, teamB: string): { winner: string, scoreA: number, scoreB: number } {
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

    public simulateRemainingMatches(): SimulationResult {
        const results: SimulationResult = {};

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
                roundLosses: 0
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
                        const { winner, scoreA, scoreB } = this.simulateSeries(teamA, teamB);
                        const simulatedMatch: MatchResult = {
                            team1: teamA,
                            team2: teamB,
                            score1: scoreA,
                            score2: scoreB,
                            group
                        };
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

        return results;
    }

    private updateStandings(standings: SimulationResult, match: MatchResult): void {
        const { team1, team2, score1, score2, group } = match;
        
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

    private getHeadToHead(teamA: string, teamB: string, groupTeams: string[]): number | null {
        // Get all matches between these two teams in the group stage
        const matches = this.matches.filter(match => 
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
