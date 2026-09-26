import test from 'node:test';
import assert from 'node:assert/strict';
import { createShellController } from '../../src/app/shell-flow.ts';
import { createUiModel } from '../../src/adapters/zustand/ui-model.ts';

function host() {
  const model=createUiModel(), states=[];
  const unsubscribe=model.reader.subscribe(view=>states.push(view.phase));
  const controller=createShellController(model);
  return {model,states,controller,unsubscribe};
}
test('factory construction starts no flow; start is explicit and idempotent',()=>{
  const h=host(); assert.deepEqual(h.states,[]);
  h.controller.send({type:'READY'}); assert.equal(h.model.reader.getSnapshot().phase,'loading');
  h.controller.start();h.controller.start();assert.deepEqual(h.states,['loading']);
  h.controller.dispose();h.unsubscribe();
});
test('real XState transitions publish to actual Zustand; a restart waits for readiness',()=>{
  const h=host();h.controller.start();
  for(const type of ['READY','TOGGLE','TOGGLE','RESTART','TOGGLE','READY']) h.controller.send({type});
  assert.equal(h.model.reader.getSnapshot().phase,'ready');
  assert.deepEqual(h.states.slice(0,5),['loading','ready','paused','ready','loading']);
  h.controller.dispose();h.unsubscribe();
});
test('disposal prevents stale publications and a fresh session is independent',()=>{
  const a=host();a.controller.start();a.controller.send({type:'READY'});
  const before=a.states.length;a.controller.dispose();a.controller.dispose();
  a.controller.send({type:'TOGGLE'});assert.equal(a.states.length,before);
  assert.throws(()=>a.controller.start(),/disposed/);
  const b=host();b.controller.start();assert.equal(b.model.reader.getSnapshot().phase,'loading');
  a.controller.send({type:'FAIL'});assert.equal(b.model.reader.getSnapshot().phase,'loading');
  b.controller.dispose();a.unsubscribe();b.unsubscribe();
});
test('failure is not readiness and cannot silently create another session',()=>{
  const h=host();h.controller.start();h.controller.send({type:'FAIL'});
  for(const type of ['READY','RESTART','TOGGLE'])h.controller.send({type});
  assert.equal(h.model.reader.getSnapshot().phase,'failed');h.controller.dispose();h.unsubscribe();
});
test('UI reader cannot mutate the projection or reach a second gameplay store',()=>{
  const h=host();assert.deepEqual(Object.keys(h.model.reader).sort(),['getSnapshot','subscribe']);
  assert.throws(()=>{h.model.reader.getSnapshot().phase='ready';},TypeError);
  h.unsubscribe();h.controller.start();assert.deepEqual(h.states,[]);h.controller.dispose();
});
