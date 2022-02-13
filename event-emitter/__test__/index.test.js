import {EventEmitter} from '../index.js';

describe('EventEmitter', () => {
  it('Should emit event once', () => {
    let count = 0;

    const ee = new EventEmitter();
    ee.once('fire-once', () => (count++));
    ee.emit('fire-once');
    ee.emit('fire-once');

    expect(count).toBe(1);
  });

  it('Should emit multiple times', () => {
    let count = 0;

    const ee = new EventEmitter();
    ee.on('fire-multiple', () => (count++));
    ee.emit('fire-multiple');
    ee.emit('fire-multiple');

    expect(count).toBe(2);
  });

  it('Should remove event with callback reference', () => {
    const ee = new EventEmitter();
    const cb = () => {};

    ee.on('remove', cb);
    ee.off('remove', cb);

    expect(ee.events.remove.length).toBe(0);
  });

  it('Should not remove event without callback reference', () => {
    const ee = new EventEmitter();

    ee.on('remove', () => {});
    ee.off('remove', () => {});

    expect(ee.events.remove.length).toBe(1);
  });

  it('Should remove all named events', () => {
    const ee = new EventEmitter();

    ee.once('remove', () => {});
    ee.on('remove', () => {});
    ee.on('remove', () => {});
    ee.on('remove', () => {});
    ee.on('remove', () => {});
    ee.on('remove', () => {});
    ee.off('remove');

    expect(ee.events.remove.length).toBe(0);
  });

  it('Should remove all events', () => {
    const ee = new EventEmitter();

    ee.once('once', () => {});
    ee.once('once', () => {});
    ee.on('on', () => {});
    ee.on('on', () => {});
    ee.destroy();

    expect(Object.keys(ee.events).length).toBe(0);
  });

  it('Should not remove persisted events', () => {
    const ee = new EventEmitter();

    ee.on('persist', () => {}, {persist: true});
    ee.off('persist');

    expect(ee.events.persist.length).toBe(1);
  });

  it('Should force remove persisted events', () => {
    const ee = new EventEmitter();

    ee.on('persist', () => {}, {persist: true});
    ee.off('persist', null, true);

    expect(ee.events.persist.length).toBe(0);
  });
});
