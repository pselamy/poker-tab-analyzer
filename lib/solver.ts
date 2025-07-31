/**
 * Poker solver wrapper using pokersolver library
 */

// @ts-ignore - pokersolver doesn't have types
import pokersolver from "pokersolver";
const { Hand } = pokersolver;

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

    // Convert 10 to T for pokersolver
    const formattedRank = rank === "10" ? "T" : rank;

    return formattedRank + (suitMap[suit] || suit);
  }

  /**
   * Calculate approximate win probability
   */
  private calculateWinProbability(
    hand: any,
    communityCount: number,
    playerCount: number,
  ): number {
    // pokersolver ranks: 1=high card, 2=pair, 3=two pair, 4=three of a kind,
    // 5=straight, 6=flush, 7=full house, 8=four of a kind, 9=straight flush

    // Base probabilities for each hand type
    const handStrengths: Record<number, number> = {
      1: 0.17, // High card
      2: 0.45, // One pair
      3: 0.65, // Two pair
      4: 0.75, // Three of a kind
      5: 0.8, // Straight
      6: 0.85, // Flush
      7: 0.9, // Full house
      8: 0.95, // Four of a kind
      9: 0.99, // Straight flush
    };

    let baseStrength = handStrengths[hand.rank] || 0.5;

    // Special case for pocket aces preflop
    if (
      communityCount === 0 &&
      hand.name === "Pair" &&
      hand.cards &&
      hand.cards[0] &&
      hand.cards[0].rank === "A"
    ) {
      baseStrength = 0.85;
    }

    // Adjust for number of players (each additional player reduces win probability)
    const playerAdjustment = Math.pow(0.9, playerCount - 2);

    return Math.min(baseStrength * playerAdjustment, 0.95);
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
