/**
 * Tests for PokerSolver
 */

import { PokerSolver, SolverResult } from "./solver";

describe("PokerSolver", () => {
  let solver: PokerSolver;

  beforeEach(() => {
    solver = new PokerSolver();
  });

  describe("analyze", () => {
    it("should handle empty hand", () => {
      const result = solver.analyze([], [], 0, 6);

      expect(result.currentHand).toBeNull();
      expect(result.winProbability).toBe(0);
      expect(result.recommendedAction).toBe("fold");
    });

    it("should analyze pocket aces preflop", () => {
      const result = solver.analyze(["A♠", "A♥"], [], 100, 6);

      expect(result.currentHand).toBeTruthy();
      expect(result.currentHand?.name).toContain("Pair");
      expect(result.winProbability).toBeGreaterThan(0.5);
      expect(result.recommendedAction).toBe("raise");
    });

    it("should analyze full house", () => {
      const result = solver.analyze(
        ["K♠", "K♥"],
        ["K♦", "7♣", "7♠"],
        500,
        4,
      );

      expect(result.currentHand?.name).toContain("Full House");
      expect(result.winProbability).toBeGreaterThan(0.8);
      expect(result.recommendedAction).toBe("raise");
      expect(result.raiseAmount).toBeGreaterThan(0);
    });

    it("should recommend fold for weak hand", () => {
      const result = solver.analyze(
        ["2♠", "7♥"],
        ["A♦", "K♣", "Q♠"],
        1000,
        6,
      );

      expect(result.winProbability).toBeLessThan(0.3);
      expect(result.recommendedAction).toBe("fold");
    });

    it("should recommend check for medium hand", () => {
      const result = solver.analyze(
        ["J♠", "10♥"],
        ["9♦", "8♣", "2♠"],
        200,
        4,
      );

      expect(result.winProbability).toBeGreaterThan(0.3);
      expect(result.winProbability).toBeLessThan(0.5);
      expect(result.recommendedAction).toBe("check");
    });
  });

  describe("card formatting", () => {
    it("should handle various card formats", () => {
      const hands = [
        { hole: ["A♠", "K♠"], community: ["Q♠", "J♠", "10♠"] },
        { hole: ["2♥", "2♦"], community: ["2♣", "7♠", "7♥"] },
        { hole: ["Q♣", "J♣"], community: [] },
      ];

      for (const hand of hands) {
        const result = solver.analyze(hand.hole, hand.community, 100, 6);
        expect(result.currentHand).toBeTruthy();
        expect(result.winProbability).toBeGreaterThan(0);
      }
    });
  });

  describe("win probability", () => {
    it("should decrease with more players", () => {
      const holeCards = ["A♠", "K♠"];
      const communityCards = ["Q♠", "5♥", "2♦"];

      const result2Players = solver.analyze(holeCards, communityCards, 100, 2);
      const result6Players = solver.analyze(holeCards, communityCards, 100, 6);
      const result9Players = solver.analyze(holeCards, communityCards, 100, 9);

      expect(result2Players.winProbability).toBeGreaterThan(
        result6Players.winProbability,
      );
      expect(result6Players.winProbability).toBeGreaterThan(
        result9Players.winProbability,
      );
    });

    it("should increase with better hands", () => {
      const communityCards = ["10♠", "J♠", "Q♠"];

      const highCard = solver.analyze(["2♥", "7♦"], communityCards, 100, 4);
      const pair = solver.analyze(["10♥", "5♦"], communityCards, 100, 4);
      const twoPair = solver.analyze(["10♥", "J♦"], communityCards, 100, 4);
      const straight = solver.analyze(["K♠", "9♠"], communityCards, 100, 4);

      expect(pair.winProbability).toBeGreaterThan(highCard.winProbability);
      expect(twoPair.winProbability).toBeGreaterThan(pair.winProbability);
      expect(straight.winProbability).toBeGreaterThan(twoPair.winProbability);
    });
  });

  describe("action recommendations", () => {
    it("should scale raise amount with pot size", () => {
      const holeCards = ["A♠", "A♥"];
      const communityCards = ["K♠", "7♥", "2♦"];

      const smallPot = solver.analyze(holeCards, communityCards, 100, 4);
      const largePot = solver.analyze(holeCards, communityCards, 1000, 4);

      expect(smallPot.recommendedAction).toBe("raise");
      expect(largePot.recommendedAction).toBe("raise");
      expect(largePot.raiseAmount!).toBeGreaterThan(smallPot.raiseAmount!);
    });

    it("should recommend appropriate actions", () => {
      const scenarios = [
        {
          hole: ["2♠", "7♥"],
          community: ["A♠", "K♥", "Q♦"],
          expectedAction: "fold",
        },
        {
          hole: ["J♠", "J♥"],
          community: ["5♠", "6♥", "7♦"],
          expectedAction: "call",
        },
        {
          hole: ["A♠", "K♠"],
          community: ["Q♠", "J♠", "10♠"],
          expectedAction: "raise",
        },
      ];

      for (const scenario of scenarios) {
        const result = solver.analyze(
          scenario.hole,
          scenario.community,
          200,
          4,
        );
        expect(result.recommendedAction).toBe(scenario.expectedAction);
      }
    });
  });

  describe("outs calculation", () => {
    it("should calculate outs for incomplete hands", () => {
      const result = solver.analyze(["A♠", "K♠"], ["Q♠", "J♥"], 100, 4);

      expect(result.outs).toBeGreaterThan(0);
    });

    it("should return 0 outs for complete hands", () => {
      const result = solver.analyze(
        ["A♠", "K♠"],
        ["Q♠", "J♠", "10♠", "5♥", "2♦"],
        100,
        4,
      );

      expect(result.outs).toBe(0);
    });
  });

  describe("getAllHands", () => {
    it("should return all poker hand types", () => {
      const hands = PokerSolver.getAllHands();

      expect(hands).toContain("Royal Flush");
      expect(hands).toContain("Straight Flush");
      expect(hands).toContain("Four of a Kind");
      expect(hands).toContain("Full House");
      expect(hands).toContain("Flush");
      expect(hands).toContain("Straight");
      expect(hands).toContain("Three of a Kind");
      expect(hands).toContain("Two Pair");
      expect(hands).toContain("One Pair");
      expect(hands).toContain("High Card");
      expect(hands.length).toBe(10);
    });
  });
});
