import test from 'node:test';
import assert from 'node:assert/strict';
import { TurnScheduler, TurnContinuationGate, TURN_TICK } from '../../src/modules/turns/index.ts';

function host() {
  let calls = 0; let ticket = null; let capture = true; let moving = false;
  const actor = {
    character: { position: 33, get isMoving() { return moving; }, buffs: () => [] },
    act() {
      calls++;
      scheduler.spend(actor, TURN_TICK);
      if (capture) ticket = gate.capture(actor);
      return false;
    },
    onAdd() {}, onRemove() {},
  };
  const scheduler = new TurnScheduler(1024, new Set(), {
    hero: () => actor, heroIsAlive: () => true, addDuration() {},
  });
  const gate = new TurnContinuationGate(scheduler);
  scheduler.add(actor);
  return {
    actor, scheduler, gate,
    get ticket() { return ticket; },
    get calls() { return calls; },
    set capture(value) { capture = value; },
    set moving(value) { moving = value; },
  };
}

test('valid completion releases precisely one pending actor, without advancing time or processing another action', () => {
  const h = host(); h.scheduler.process();
  const before = h.scheduler.clockOf(h.actor);
  assert.equal(h.gate.acknowledge(h.ticket), true);
  assert.equal(h.scheduler.currentActor, null); assert.equal(h.calls, 1);
  assert.deepEqual(h.scheduler.clockOf(h.actor), before);
  assert.equal(h.gate.acknowledge(h.ticket), false);
  h.scheduler.process(); assert.equal(h.calls, 2);
});

test('an old callback cannot complete a later turn of the SAME actor even without a new capture', () => {
  const h = host(); h.scheduler.process(); const old = h.ticket;
  h.scheduler.next(h.actor); h.capture = false; h.scheduler.process();
  assert.equal(h.gate.acknowledge(old), false);
  assert.equal(h.scheduler.currentActor, h.actor); assert.equal(h.calls, 2);
});

test('capturing a later action invalidates the earlier ticket, while repeated capture within one action is stable', () => {
  const h = host(); h.scheduler.process(); const old = h.ticket;
  assert.equal(h.gate.capture(h.actor), old);
  h.scheduler.next(h.actor); h.scheduler.process(); const next = h.ticket;
  assert.notEqual(next, old); assert.ok(next.serial > old.serial);
  assert.equal(h.gate.acknowledge(old), false);
  assert.equal(h.gate.acknowledge(next), true);
});

test('forged or foreign tickets cannot consume the valid pending barrier', () => {
  const a = host(); const b = host(); a.scheduler.process(); b.scheduler.process();
  assert.equal(a.gate.acknowledge({ serial: a.ticket.serial }), false);
  assert.equal(a.gate.acknowledge(b.ticket), false);
  assert.equal(a.gate.acknowledge(a.ticket), true);
  assert.equal(a.gate.acknowledge(a.ticket), false);
  assert.equal(b.scheduler.currentActor, b.actor);
});

test('clear invalidates callbacks even though original clear preserves current actor', () => {
  const h = host(); h.scheduler.process(); const old = h.ticket;
  h.scheduler.clear(); assert.equal(h.scheduler.currentActor, h.actor);
  assert.equal(h.gate.acknowledge(old), false);
  assert.equal(h.scheduler.currentActor, h.actor);
  h.scheduler.initialize([], []); h.scheduler.process();
  assert.equal(h.gate.acknowledge(h.ticket), true);
});

test('initialize without clear still creates a new callback generation', () => {
  const h = host(); h.scheduler.process(); const old = h.ticket;
  h.scheduler.initialize([], []); h.capture = false; h.scheduler.process();
  assert.equal(h.gate.acknowledge(old), false); assert.equal(h.scheduler.currentActor, h.actor);
});

test('cancellation leaves the source turn waiting; an action owner may explicitly capture a fresh completion', () => {
  const h = host(); h.scheduler.process(); const old = h.ticket;
  h.gate.cancel(); assert.equal(h.gate.acknowledge(old), false);
  assert.equal(h.scheduler.currentActor, h.actor);
  const next = h.gate.capture(h.actor); assert.notEqual(next, old);
  assert.equal(h.gate.acknowledge(next), true);
});

test('dispose is idempotent and prevents future captures or releases', () => {
  const h = host(); h.scheduler.process();
  h.gate.dispose(); h.gate.dispose();
  assert.equal(h.gate.acknowledge(h.ticket), false);
  assert.throws(() => h.gate.capture(h.actor), /disposed/);
  assert.equal(h.scheduler.currentActor, h.actor);
});

test('capture is rejected for a non-current actor and before an action starts', () => {
  const h = host(); assert.throws(() => h.gate.capture(h.actor), /current actor/);
  h.scheduler.process(); const other = { ...h.actor };
  assert.throws(() => h.gate.capture(other), /current actor/);
  assert.equal(h.gate.acknowledge(h.ticket), true);
});

test('moving pause does not create an action ticket and normal completion works after motion ends', () => {
  const h = host(); h.moving = true; h.scheduler.process();
  assert.equal(h.calls, 0); assert.equal(h.ticket, null);
  assert.throws(() => h.gate.capture(h.actor), /current actor/);
  h.moving = false; h.scheduler.process(); assert.equal(h.calls, 1);
  assert.equal(h.gate.acknowledge(h.ticket), true);
});

test('a removed current actor can finish its own original next, rather than being blocked by a new membership check', () => {
  const h = host(); h.scheduler.process(); h.scheduler.remove(h.actor);
  assert.equal(h.scheduler.has(h.actor), false);
  assert.equal(h.gate.acknowledge(h.ticket), true);
  assert.equal(h.scheduler.currentActor, null);
});

test('clock normalization and repeated blocked process do not invent a new action revision', () => {
  const h = host(); h.scheduler.process(); const old = h.ticket;
  h.scheduler.process(); h.scheduler.fixTime();
  assert.equal(h.gate.capture(h.actor), old); assert.equal(h.gate.acknowledge(old), true);
});

test('a long headless completion sequence retains the same explicit processing and one-use contract', () => {
  const h = host(); let previous = null;
  for (let i = 1; i <= 1000; i++) {
    h.scheduler.process(); const current = h.ticket;
    assert.equal(current.serial, BigInt(i));
    if (previous !== null) assert.equal(h.gate.acknowledge(previous), false);
    assert.equal(h.gate.acknowledge(current), true);
    previous = current;
  }
  assert.equal(h.calls, 1000); assert.equal(h.scheduler.clockOf(h.actor).time, 1000);
});
