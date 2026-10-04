import test, {beforeEach,afterEach,mock} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {env} from '../src/config/env.js';
import {pool} from '../src/db/pool.js';
import {memoryDatabase} from './helpers/memoryDatabase.js';
import {destination,travelPackage,experience} from './helpers/contentFixtures.js';

let db;
let ip=1;
const cookie=`st_admin=${jwt.sign({sub:'1'},env.JWT_SECRET,{algorithm:'HS256'})}`;
function api(method,path,body) {
  const result=request(app)[method](path).set('Origin',env.CLIENT_URL).set('Cookie',cookie).set('X-Forwarded-For',`203.0.113.${ip++}`);
  return body === undefined ? result : result.send(body);
}
beforeEach(()=>{
  db=memoryDatabase();
  for(const method of ['execute','query','getConnection']) mock.method(pool,method,db[method]);
});
afterEach(()=>mock.restoreAll());

for(const [entity,fixture] of [['destinations',destination],['packages',travelPackage],['experiences',experience]]) {
  const path=`/api/admin/${entity}`;
  test(`${entity}: every CRUD endpoint rejects anonymous requests`,async()=>{
    for(const [method,suffix] of [['get',''],['get','/1'],['post',''],['patch','/1'],['delete','/1']]) {
      const response=await request(app)[method](path+suffix).send({});
      assert.equal(response.status,401);
    }
    assert.equal(db.calls.length,0);
  });
  test(`${entity}: create normalizes slug and returns 201`,async()=>{
    const response=await api('post',path,{...fixture,slug:'  New Test Content  '});
    assert.equal(response.status,201);
    assert.equal(response.body.data.slug,'new-test-content');
    assert.ok(response.body.data.id);
  });
  test(`${entity}: get and paginated list return structured content`,async()=>{
    const created=await api('post',path,fixture);
    if(entity==='destinations') assert.equal(created.status,409); // Fixture already present.
    else assert.equal(created.status,201);
    const id=entity==='destinations'?1:created.body.data.id;
    const one=await api('get',path+'/'+id);
    assert.equal(one.status,200);
    assert.equal(one.body.data.slug,fixture.slug);
    const list=await api('get',path+'?page=1&limit=1');
    assert.equal(list.status,200);
    assert.equal(list.body.data.items.length,1);
    assert.equal(list.body.data.limit,1);
  });
  test(`${entity}: PATCH changes only supplied fields`,async()=>{
    const created=entity==='destinations'?{body:{data:{id:1}}}:await api('post',path,fixture);
    const id=created.body.data.id;
    const before=structuredClone(db.state[entity].find(row=>row.id===id));
    const field=entity==='packages'?'title':'name';
    const response=await api('patch',path+'/'+id,{[field]:'Changed title'});
    assert.equal(response.status,200);
    const after=db.state[entity].find(row=>row.id===id);
    assert.deepEqual(after,{...before,[field]:'Changed title'});
    const sql=db.calls.find(call=>call.sql.startsWith('UPDATE')).sql;
    assert.match(sql,new RegExp('SET '+field+' = \\? WHERE'));
    assert.ok(!sql.includes('featured ='));
  });
  test(`${entity}: duplicate slug returns safe 409`,async()=>{
    if(entity!=='destinations') await api('post',path,fixture);
    const response=await api('post',path,fixture);
    assert.equal(response.status,409);
    assert.equal(JSON.stringify(response.body).includes('SQL'),false);
  });
  test(`${entity}: invalid URLs, empty PATCH and uncontrolled fields return 400`,async()=>{
    assert.equal((await api('post',path,{...fixture,image:'javascript:alert(1)'})).status,400);
    assert.equal((await api('patch',path+'/1',{})).status,400);
    assert.equal((await api('patch',path+'/1',{arbitrary:'payload'})).status,400);
  });
  test(`${entity}: missing read/update/delete returns 404`,async()=>{
    assert.equal((await api('get',path+'/999')).status,404);
    assert.equal((await api('patch',path+'/999',entity==='packages'?{title:'Missing'}:{sort:1})).status,404);
    assert.equal((await api('delete',path+'/999')).status,404);
  });
  test(`${entity}: unreferenced records can be deleted`,async()=>{
    const id=entity==='destinations'?1:(await api('post',path,fixture)).body.data.id;
    const response=await api('delete',path+'/'+id);
    assert.equal(response.status,200);
    assert.ok(!db.state[entity].some(row=>row.id===id));
  });
}
test('destinations: linked package blocks deletion and rolls back',async()=>{
  db.state.packages.push({...travelPackage,id:2});
  assert.equal((await api('delete','/api/admin/destinations/1')).status,409);
  assert.equal(db.state.destinations.length,1);
  assert.equal(db.rolledBack,true);
});
test('destinations: direct lead reference blocks deletion',async()=>{
  db.state.leads.push({id:1,destination_id:1});
  assert.equal((await api('delete','/api/admin/destinations/1')).status,409);
  assert.equal(db.state.leads.length,1);
});
test('packages: historical lead reference blocks deletion',async()=>{
  db.state.packages.push({...travelPackage,id:2});
  db.state.leads.push({id:1,package_id:2});
  assert.equal((await api('delete','/api/admin/packages/2')).status,409);
  assert.equal(db.state.packages.length,1);
});
test('packages: missing destination rejected',async()=>{
  assert.equal((await api('post','/api/admin/packages',{...travelPackage,destination_id:999})).status,400);
});
test('packages: invalid prices, durations, categories, status and itinerary rejected',async()=>{
  for(const patch of [{price:-1},{duration_days:0},{category:'unknown'},{status:'hidden'},{rating:6},{gallery:['file:///private']},{itinerary:[{day:1,title:'Day',description:'Text',activities:[],unsafe:true}]}]) {
    assert.equal((await api('post','/api/admin/packages',{...travelPackage,...patch})).status,400);
  }
});
test('packages: normalized false remains false; omitted booleans do not change',async()=>{
  const created=await api('post','/api/admin/packages',{...travelPackage,featured:'false',best_seller:'true'});
  assert.equal(created.body.data.featured,false);
  assert.equal(created.body.data.best_seller,true);
  assert.equal((await api('post','/api/admin/packages',{...travelPackage,featured:'yes'})).status,400);
});
test('destinations and experiences reject arbitrary structured JSON',async()=>{
  assert.equal((await api('post','/api/admin/destinations',{...destination,travel_info:{...destination.travel_info,unsafe:'field'}})).status,400);
  assert.equal((await api('post','/api/admin/experiences',{...experience,examples:[{text:'not a string'}]})).status,400);
});
test('admin package list filters drafts and uses parameterized text pagination',async()=>{
  await api('post','/api/admin/packages',travelPackage);
  const response=await api('get','/api/admin/packages?status=draft&destination_id=1&category=family&limit=1');
  assert.equal(response.status,200);
  assert.equal(response.body.data.total,1);
  const call=db.calls.find(row=>row.sql.includes('LIMIT ? OFFSET ?'));
  assert.deepEqual(call.params,[1,'family','draft',1,0]);
});
