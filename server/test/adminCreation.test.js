import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import {createAdmin} from '../src/services/adminCreation.js';
import {adminCreationSchema} from '../src/validators/adminCreation.js';
test('admin creation normalizes email and hashes password with cost 12',async()=>{
  const password='StrongTestPassword123!';
  let saved;
  const result=await createAdmin({async execute(sql,params){saved=params;return[{insertId:2}];}},{email:' ADMIN@EXAMPLE.TEST ',password});
  assert.deepEqual(result,{id:2});
  assert.equal(saved[0],'admin@example.test');
  assert.notEqual(saved[1],password);
  assert.equal(bcrypt.getRounds(saved[1]),12);
  assert.equal(await bcrypt.compare(password,saved[1]),true);
});
test('duplicate admin fails without updating password',async()=>{
  let sql;
  await assert.rejects(createAdmin({async execute(statement){sql=statement;throw Object.assign(new Error('private'),{code:'ER_DUP_ENTRY'});}},{email:'admin@example.test',password:'StrongTestPassword123!'}),{code:'ADMIN_EXISTS'});
  assert.match(sql,/^INSERT/);
  assert.ok(!sql.includes('UPDATE'));
});
test('admin creation rejects invalid email',()=>{
  assert.equal(adminCreationSchema.safeParse({email:'invalid',password:'StrongTestPassword123!'}).success,false);
});
test('admin creation rejects short, weak and oversized UTF-8 passwords',()=>{
  for(const password of ['Short123!','longpasswordwithoutclasses','A'.repeat(73)+'1!','Å'.repeat(40)+'a1!']) {
    assert.equal(adminCreationSchema.safeParse({email:'admin@example.test',password}).success,false);
  }
});
