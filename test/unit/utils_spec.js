/*globals describe, it*/
import should from 'should';

// Stuff to test

import utils from '../../core/utils';

describe('Safe String', () => {
  let safeString = utils.safeString;
  
  it('should remove beginning and ending whitespace', () => {
    let result = safeString(' stringwithspace ');
    result.should.equal('stringwithspace');
  });
  
  it('should remove non ascii characters', () => {
    let result = safeString('howtowin✓');
    result.should.equal('howtowin');
  });
  
  it('should replace spaces with dashes', () => {
    let result = safeString('how to win');
    result.should.equal('how-to-win');
  });
  
  it('should replace most special characters with dashes', () => {
    let result = safeString('a:b/c?d#e[f]g!h$i&j(k)l*m+n,o;p=q\\r%s<t>u|v^w~x@y"z£1.2');
    result.should.equal('a-b-c-d-e-f-g-h-i-j-k-l-m-n-o-p-q-r-s-t-u-v-w-x-y-z-1-2');
  });
  
  it('should remove special characters at the beginning of a string', () => {
    let result = safeString('.Not special');
    result.should.equal('not-special');
  });
  
  it('should remove apostrophes', () => {
    let result = safeString('how we shouldn\'t be');
    result.should.equal('how-we-shouldnt-be');
  });
  
  it('should convert to lowercase', () => {
    let result = safeString('This has Upper Case');
    result.should.equal('this-has-upper-case');
  });
  
  it('should convert multiple dashes into a single dash', () => {
    let result = safeString('This :) means everything');
    result.should.equal('this-means-everything');
  });
  
  it('should remove trailing dashes from the result', () => {
    let result = safeString('This.');
    result.should.equal('this');
  });
  
  it('should handle pound signs', () => {
    let result = safeString('WHOOPS! I spend all my £ again!');
    result.should.equal('whoops-i-spend-all-my-again');
  });
  
  it('should properly handle unicode punctuation conversion', () => {
    let result = safeString('に間違いがないか、再度確認してください。再読み込みしてください。');
    result.should.equal('nijian-wei-iganaika-zai-du-que-ren-sitekudasai-zai-du-miip-misitekudasai');
  });
})