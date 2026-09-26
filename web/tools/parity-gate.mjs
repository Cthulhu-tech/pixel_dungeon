// No independent original-game fixtures exist yet. Fail explicitly; never report an empty suite as parity.
console.error('NOT_READY: original-game parity fixtures/oracle are not implemented. This smoke app is not a complete port.');
process.exitCode = 2;
