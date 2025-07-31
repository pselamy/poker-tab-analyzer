/**
 * Poker solver wrapper using pokersolver library
 */

// @ts-ignore - pokersolver doesn't have types
import { Hand } from "pokersolver";

export interface HandAnalysis {
  hand: string;
  rank: number;
  name: string;
  descr: string;
}

export interface SolverResult {
  currentHand: HandAnalysis | null;
  winProbability: number;
  recommendedAction: "fold" | "check" | "call" | "raise";
  raiseAmount?: number;
  outs?: number;
}

export class PokerSolver {
  /**
   * Analyze a poker hand and provide recommendations
   */
  analyze(
    holeCards: string[],
    communityCards: string[],
    potSize: number,
    playerCount: number,
  ): SolverResult {
    const allCards = [...holeCards, ...communityCards];

    // Only analyze if we have cards
    if (allCards.length < 2) {
      return {
        currentHand: null,
        winProbability: 0,
        recommendedAction: "fold",
      };
    }

    // Convert card format for pokersolver (e.g., "A♠" -> "As")
    const formattedCards = allCards.map((card) => this.formatCard(card));

    // Get current hand strength
    const hand = Hand.solve(formattedCards);
    const currentHand: HandAnalysis = {
      hand: hand.toString(),
      rank: hand.rank,
      name: hand.name,
      descr: hand.descr,
    };

    // Calculate win probability (simplified)
    const winProbability = this.calculateWinProbability(
      hand,
      communityCards.length,
      playerCount,
    );

    // Determine action
    const action = this.determineAction(winProbability, potSize);

    return {
      currentHand,
      winProbability,
      recommendedAction: action.action,
      raiseAmount: action.raiseAmount,
      outs: this.calculateOuts(holeCards, communityCards),
    };
  }

  /**
   * Convert card format for pokersolver
   */
  private formatCard(card: string): string {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);

    const suitMap: Record<string, string> = {
      "♠": "s",
      "♥": "h",
      "♦": "d",
      "♣": "c",
    };

    return rank + (suitMap[suit] || suit);
  }

  /**
   * Calculate approximate win probability
   */
  private calculateWinProbability(
    hand: any,
    communityCount: number,
    playerCount: number,
  ): number {
    // Hand strength ranges from 1 (high card) to 9 (straight flush)
    const baseStrength = hand.rank / 9;

    // Adjust for game stage
    let stageMultiplier = 1;
    if (communityCount === 0)
      stageMultiplier = 0.8; // Pre-flop
    else if (communityCount === 3)
      stageMultiplier = 0.9; // Flop
    else if (communityCount === 4) stageMultiplier = 0.95; // Turn

    // Adjust for number of players
    const playerMultiplier = Math.pow(0.85, playerCount - 1);

    return Math.min(baseStrength * stageMultiplier * playerMultiplier, 0.95);
  }

  /**
   * Determine recommended action
   */
  private determineAction(
    winProbability: number,
    potSize: number,
  ): { action: "fold" | "check" | "call" | "raise"; raiseAmount?: number } {
    if (winProbability < 0.3) {
      return { action: "fold" };
    } else if (winProbability < 0.5) {
      return { action: "check" };
    } else if (winProbability < 0.7) {
      return { action: "call" };
    } else {
      return {
        action: "raise",
        raiseAmount: Math.floor(potSize * 0.75),
      };
    }
  }

  /**
   * Calculate number of outs
   */
  private calculateOuts(holeCards: string[], communityCards: string[]): number {
    // Simplified out calculation
    // In a real implementation, this would check for draws
    if (communityCards.length < 5) {
      return 8; // Average estimate
    }
    return 0;
  }

  /**
   * Get all possible hands for testing
   */
  static getAllHands(): string[] {
    return [
      "Royal Flush",
      "Straight Flush",
      "Four of a Kind",
      "Full House",
      "Flush",
      "Straight",
      "Three of a Kind",
      "Two Pair",
      "One Pair",
      "High Card",
    ];
  }
}
