const { expect } = require('chai');

const { solve } = require('./solution');

describe('1001 - Extremely Basic', () => {
  it('solves the sample case', () => {
    expect(solve('10\n9\n')).to.equal('X = 19\n');
  });

  it('solves negative values', () => {
    expect(solve('-10\n4\n')).to.equal('X = -6\n');
  });
});
