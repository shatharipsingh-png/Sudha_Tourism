import test,{beforeEach,afterEach,mock} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import {pool} from '../src/db/pool.js';
import {notifications,createNotifier} from '../src/services/notifications/index.js';
import {createEmailChannel,leadMessage} from '../src/services/notifications/email.js';
import {notificationSchema} from '../src/config/notifications.js';

let ip=100;
beforeEach(()=>mock.method(pool,'execute',async()=>[{insertId:25}]));
afterEach(()=>mock.restoreAll());
for(const type of ['enquiry','contact','booking']) {
  test(`saved ${type} triggers notification after successful response`,async()=>{
    if(type==='booking') mock.method(pool,'execute',async sql=>sql.startsWith('SELECT')?[[{id:1}]]:[{insertId:25}]);
    let observed;
    const notified=new Promise(resolve=>{
      mock.method(notifications,'leadCreated',async lead=>{observed=lead;resolve();return{status:'accepted'};});
    });
    const body={type,name:'Test',email:'test@example.test',phone:'+91 12345678',message:'Test message requirements'};
    if(type==='booking') Object.assign(body,{package_id:1,travelers:2,travel_date:'2099-01-01'});
    const response=await request(app).post('/api/leads').set('X-Forwarded-For',`192.0.2.${ip++}`).send(body);
    assert.equal(response.status,200);
    await notified;
    assert.equal(observed.type,type);
    assert.equal(observed.id,25);
    assert.equal(Object.hasOwn(observed,'ip_hash'),false);
  });
}
test('newsletter never calls actionable notification service',async()=>{
  const notify=mock.method(notifications,'leadCreated',async()=>{});
  const response=await request(app).post('/api/leads').set('X-Forwarded-For',`192.0.2.${ip++}`).send({type:'newsletter',email:'test@example.test',consent:true});
  assert.equal(response.status,200);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(notify.mock.callCount(),0);
});
test('notification rejection leaves stored lead HTTP response successful',async()=>{
  let invoked;
  const notified=new Promise(resolve=>{invoked=resolve;});
  mock.method(notifications,'leadCreated',async()=>{invoked();throw new Error('private SMTP password customer payload');});
  const logs=[];
  mock.method(console,'error',entry=>logs.push(entry));
  const response=await request(app).post('/api/leads').set('X-Forwarded-For',`192.0.2.${ip++}`).send({type:'contact',name:'Test',email:'test@example.test',message:'Test message requirements'});
  assert.equal(response.status,200);
  assert.equal(response.body.data.id,25);
  await notified;
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(logs,[JSON.stringify({event:'lead_notification_failed'})]);
});
test('disabled SMTP validates without credentials and opens no transport',async()=>{
  const config=notificationSchema.parse({});
  assert.equal(config.SMTP_ENABLED,false);
  assert.equal(createEmailChannel(config),null);
  assert.equal(notifications.enabled,false);
  assert.deepEqual(await createNotifier().leadCreated({type:'contact'}),{status:'disabled'});
});
test('enabled SMTP requires complete configuration and parses false correctly',()=>{
  assert.equal(notificationSchema.safeParse({SMTP_ENABLED:'true'}).success,false);
  const config=notificationSchema.parse({SMTP_ENABLED:'true',SMTP_HOST:'smtp.example.test',MAIL_FROM:'sender@example.test',LEAD_NOTIFICATION_TO:'admin@example.test',SMTP_SECURE:'false'});
  assert.equal(config.SMTP_SECURE,false);
  assert.equal(config.SMTP_PORT,587);
});
test('mock email transport receives escaped HTML and plain text only useful lead fields',async()=>{
  let mail;
  const channel=createEmailChannel({SMTP_ENABLED:true,MAIL_FROM:'sender@example.test',LEAD_NOTIFICATION_TO:'admin@example.test'},{
    async sendMail(value){mail=value;return{accepted:['admin@example.test'],rejected:[]};}
  });
  await channel({type:'contact',name:'<script>Test</script>',email:'test@example.test',message:'Hello & goodbye',ip_hash:'SECRET',cookie:'SECRET',created_at:'2026-01-01'});
  assert.match(mail.html,/&lt;script&gt;/);
  assert.ok(!mail.html.includes('<script>'));
  assert.match(mail.text,/Hello & goodbye/);
  assert.ok(!JSON.stringify(mail).includes('SECRET'));
});
test('transport rejection is recorded generically and never claims delivery',async()=>{
  const logs=[];
  const notifier=createNotifier({channels:[async()=>{throw new Error('private');}],logger:{error:entry=>logs.push(entry),log:entry=>logs.push(entry)}});
  assert.deepEqual(await notifier.leadCreated({type:'contact'}),{status:'failed'});
  assert.deepEqual(logs,[JSON.stringify({event:'lead_notification_failed'})]);
});
test('newsletter is ignored even with channels configured',async()=>{
  let calls=0;
  const notifier=createNotifier({channels:[async()=>{calls++;}]});
  assert.deepEqual(await notifier.leadCreated({type:'newsletter'}),{status:'ignored'});
  assert.equal(calls,0);
});
test('SMTP recipient rejection is treated as failure',async()=>{
  const channel=createEmailChannel({SMTP_ENABLED:true}, {async sendMail(){return{accepted:[],rejected:['admin@example.test']};}});
  await assert.rejects(channel({type:'contact'}));
});
test('email template omits absent optional fields',()=>{
  const message=leadMessage({type:'contact',name:'Test',email:'test@example.test'});
  assert.ok(!message.text.includes('Phone:'));
  assert.ok(!message.text.includes('undefined'));
});
