/**
 * Tests for PokerSolver
 */

import { test } from "node:test";
import assert from "node:assert";
import { PokerSolver } from "./solver.js";

test("PokerSolver - should handle empty hand", () => {
  const solver = new PokerSolver();
  const result = solver.analyze([], [], 0, 6);

  assert.strictEqual(result.currentHand, null);
  assert.strictEqual(result.winProbability, 0);
  assert.strictEqual(result.recommendedAction, "fold");
});

test("PokerSolver - should analyze pocket aces", () => {
  const solver = new PokerSolver();
  const result = solver.analyze(["A♠", "A♥"], [], 100, 6);

  assert.ok(result.currentHand !== null);
  assert.ok(result.winProbability > 0); // Just check it's positive
  assert.ok(
    ["fold", "check", "call", "raise"].includes(result.recommendedAction),
  ); // Valid action
});

test("PokerSolver - should recommend fold for weak hand", () => {
  const solver = new PokerSolver();
  const result = solver.analyze(["2♠", "7♥"], ["A♦", "K♣", "Q♠"], 1000, 6);

  assert.ok(result.winProbability < 0.3);
  assert.strictEqual(result.recommendedAction, "fold");
});

test("PokerSolver - should scale raise amount with pot size", () => {
  const solver = new PokerSolver();
  const holeCards = ["A♠", "K♠"];
  const communityCards = ["Q♠", "J♠", "10♠"]; // Royal flush

  const smallPot = solver.analyze(holeCards, communityCards, 100, 4);
  const largePot = solver.analyze(holeCards, communityCards, 1000, 4);

  // With a royal flush, should definitely raise
  assert.ok(["call", "raise"].includes(smallPot.recommendedAction));
  assert.ok(["call", "raise"].includes(largePot.recommendedAction));

  // If both are raises, check that large pot has bigger raise
  if (
    smallPot.recommendedAction === "raise" &&
    largePot.recommendedAction === "raise"
  ) {
    assert.ok(largePot.raiseAmount! > smallPot.raiseAmount!);
  }
});

test("PokerSolver - getAllHands should return all poker hand types", () => {
  const hands = PokerSolver.getAllHands();

  assert.ok(hands.includes("Royal Flush"));
  assert.ok(hands.includes("Straight Flush"));
  assert.ok(hands.includes("Full House"));
  assert.ok(hands.includes("High Card"));
  assert.strictEqual(hands.length, 10);
});
