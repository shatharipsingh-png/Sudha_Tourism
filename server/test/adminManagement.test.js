import test,{beforeEach,afterEach,mock} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import {pool} from '../src/db/pool.js';
import {env} from '../src/config/env.js';
import {memoryDatabase} from './helpers/memoryDatabase.js';
import {publicPackageInfo} from '../src/utils/publicContent.js';

let db;
const cookie=`st_admin=${jwt.sign({sub:'1'},env.JWT_SECRET,{algorithm:'HS256'})}`;
const api=(method,path,body)=> {
  const result=request(app)[method](path).set('Cookie',cookie);
  return body===undefined?result:result.send(body);
};
beforeEach(()=>{
  db=memoryDatabase();
  for(const method of ['execute','query','getConnection']) mock.method(pool,method,db[method]);
});
afterEach(()=>mock.restoreAll());
test('successful login, admin/me and logout share cookie contract',async()=>{
  db.state.admins[0].password_hash=await bcrypt.hash('StrongTestPassword123!',12);
  const login=await request(app).post('/api/admin/login').send({email:'ADMIN@example.test',password:'StrongTestPassword123!'});
  assert.equal(login.status,200);
  const token=login.headers['set-cookie'][0].split(';')[0];
  const me=await request(app).get('/api/admin/me').set('Cookie',token);
  assert.equal(me.status,200);
  assert.equal(me.body.data.id,1);
  const logout=await request(app).post('/api/admin/logout').set('Cookie',token);
  assert.equal(logout.status,200);
  assert.match(logout.headers['set-cookie'][0],/st_admin=;/);
  assert.equal((await request(app).get('/api/admin/me')).status,401);
});
test('lead detail returns parsed requirements and handles missing resource',async()=>{
  db.state.leads.push({id:3,type:'contact',name:'Test',details:JSON.stringify({duration:'2 days'}),status:'new'});
  const response=await api('get','/api/admin/leads/3');
  assert.equal(response.status,200);
  assert.deepEqual(response.body.data.details,{duration:'2 days'});
  const sql=db.calls.find(row=>row.sql.includes('SELECT l.id')).sql;
  assert.ok(!sql.includes('ip_hash'));
  assert.equal((await api('get','/api/admin/leads/999')).status,404);
});
test('lead detail requires authentication',async()=>{
  assert.equal((await request(app).get('/api/admin/leads/1')).status,401);
});
test('lead status progresses, permits idempotence and intentional reopening',async()=>{
  db.state.leads.push({id:3,status:'new'});
  for(const status of ['contacted','contacted','closed','contacted']) {
    const response=await api('patch','/api/admin/leads/3',{status});
    assert.equal(response.status,200);
    assert.equal(db.state.leads[0].status,status);
  }
});
test('invalid lead statuses and backwards transitions are rejected',async()=>{
  db.state.leads.push({id:3,status:'contacted'});
  assert.equal((await api('patch','/api/admin/leads/3',{status:'invalid'})).status,400);
  assert.equal((await api('patch','/api/admin/leads/3',{status:'new'})).status,409);
  assert.equal((await api('patch','/api/admin/leads/999',{status:'closed'})).status,404);
});
test('lead concurrent status change returns 409',async()=>{
  mock.method(pool,'execute',async sql=>sql.includes('FROM admins')?[[{id:1,email:'admin@example.test'}]]:sql.startsWith('SELECT')?[[{status:'new'}]]:[{affectedRows:0}]);
  assert.equal((await api('patch','/api/admin/leads/3',{status:'contacted'})).status,409);
});
test('stats distinguish all leads from new leads and all packages from published',async()=>{
  mock.method(pool,'execute',async sql=>{
    if(sql.includes('FROM admins'))return[[{id:1}]];
    if(sql.includes('GROUP BY'))return[[{type:'contact',status:'new',count:2},{type:'contact',status:'closed',count:3}]];
    return[[{totalDestinations:5,totalPackages:7,publishedPackages:6,totalExperiences:6}]];
  });
  mock.method(pool,'query',async()=>[[]]);
  const response=await api('get','/api/admin/stats');
  assert.equal(response.status,200);
  assert.equal(response.body.data.totalLeads,5);
  assert.equal(response.body.data.newLeads,2);
  assert.equal(response.body.data.leadsByType.contact,5);
  assert.equal(response.body.data.newLeadsByType.contact,2);
  assert.equal(response.body.data.totalPackages,7);
  assert.equal(response.body.data.publishedPackages,6);
});
test('public package info removes only known old demo warning',()=>{
  const info={important:['DEMO PRICES — edit before launch.','Keep actual travel warning'],tips:[]};
  assert.deepEqual(publicPackageInfo(info).important,['Keep actual travel warning']);
  assert.equal(info.important.length,2);
});
test('public package detail hides draft packages',async()=>{
  mock.method(pool,'execute',async sql=>{
    assert.match(sql,/p.status = 'published'/);
    return[[]];
  });
  assert.equal((await request(app).get('/api/packages/draft-package')).status,404);
});
