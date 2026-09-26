import test from 'node:test';
import assert from 'node:assert/strict';
import { auditDependencyPins } from './audit-dependency-pins.mjs';

function manifest() { return { dependencies: { phaser: '4.2.1' }, devDependencies: { typescript: '6.0.3' } }; }
function record(name,version) { return { name, version, engines: { node: '>=22.12' }, dist: {tarball:`https://registry.example/${name}.tgz`,integrity:'test-integrity'} }; }

test('queries both dependency groups with their exact unchanged pins', () => {
  const source=manifest(), before=JSON.stringify(source), calls=[];
  const report=auditDependencyPins(source,(name,version)=>{calls.push([name,version]);return record(name,version);});
  assert.equal(report.passed,true); assert.equal(report.results.length,2);
  assert.deepEqual(calls,[['phaser','4.2.1'],['typescript','6.0.3']]);
  assert.equal(JSON.stringify(source),before);
  assert.equal(report.scope,'REGISTRY_PIN_EXISTENCE_NOT_RUNTIME_COMPATIBILITY');
});

test('registry failure remains explicit while other independent pins are still inspected', () => {
  const calls=[];
  const report=auditDependencyPins(manifest(),(name,version)=>{calls.push(name); if(name==='phaser') throw new Error('E404 missing'); return record(name,version);});
  assert.equal(report.passed,false); assert.equal(report.results[0].status,'FAILED');
  assert.match(report.results[0].error,/E404/); assert.equal(report.results[1].status,'FOUND');
  assert.deepEqual(calls,['phaser','typescript']);
});

test('a different resolved version is not a successful substitute for a missing pin', () => {
  const source=manifest(); const report=auditDependencyPins(source,(name,version)=>record(name,name==='phaser'?'4.0.0':version));
  assert.equal(report.passed,false); assert.equal(source.dependencies.phaser,'4.2.1');
  assert.match(report.results[0].error,/exact requested/);
});

test('wrong package identity or missing distribution metadata fails without fake defaults', () => {
  for(const value of [null,[],{name:'wrong',version:'4.2.1'}, {name:'phaser',version:'4.2.1'}, {name:'phaser',version:'4.2.1',dist:{tarball:'x'}}]) {
    const report=auditDependencyPins(manifest(),()=>value);
    assert.equal(report.passed,false); assert.ok(report.results.every(row=>row.status==='FAILED'));
  }
});

test('absence of optional engines is reported as unknown, not compatible', () => {
  const report=auditDependencyPins(manifest(),(name,version)=>{const value=record(name,version);delete value.engines;return value;});
  assert.equal(report.passed,true); assert.equal(report.results[0].engines,null);
  assert.equal(report.scope,'REGISTRY_PIN_EXISTENCE_NOT_RUNTIME_COMPATIBILITY');
});
