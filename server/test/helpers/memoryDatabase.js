import { destination } from './contentFixtures.js';

export function memoryDatabase() {
  const state = {
    admins:[{id:1,email:'admin@example.test'}],
    destinations:[{...structuredClone(destination),id:1}],
    packages:[],experiences:[],leads:[]
  };
  const calls=[];
  let nextId=10;
  let rolledBack=false;
  function filter(sql,params,rows) {
    const section = sql.split(/WHERE/i)[1]?.split(/ORDER BY|LIMIT/i)[0] ?? '';
    const fields=[...section.matchAll(/(?:\w+\.)?(\w+) = \?/g)].map(match=>match[1]);
    return rows.filter(row=>fields.every((field,index)=>String(row[field])===String(params[index])));
  }
  async function execute(sql,params=[]) {
    calls.push({sql,params});
    if (/^SELECT/.test(sql.trim())) {
      const table=sql.match(/FROM (\w+)/i)?.[1];
      const rows=filter(sql,params,state[table]??[]);
      if (/COUNT\(\*\)/.test(sql)) return [[{total:rows.length}]];
      return [structuredClone(rows)];
    }
    if (/^INSERT INTO/.test(sql)) {
      const [,table,columns]=sql.match(/INSERT INTO (\w+) \(([^)]+)\)/);
      const row=Object.fromEntries(columns.split(',').map((field,index)=>[field.trim(),params[index]]));
      if (state[table].some(existing=>row.slug && row.slug===existing.slug || row.email && row.email===existing.email)) {
        throw Object.assign(new Error('SQL must stay private'),{code:'ER_DUP_ENTRY'});
      }
      row.id=nextId++;
      state[table].push(row);
      return [{insertId:row.id,affectedRows:1}];
    }
    if (/^UPDATE/.test(sql)) {
      const [,table,set]=sql.match(/UPDATE (\w+) SET (.+) WHERE/);
      const fields=set.split(',').map(part=>part.split('=')[0].trim());
      const rows=filter(sql,params.slice(fields.length),state[table]);
      for (const row of rows) fields.forEach((field,index)=>{row[field]=params[index];});
      return [{affectedRows:rows.length}];
    }
    if (/^DELETE/.test(sql)) {
      const table=sql.match(/FROM (\w+)/)[1];
      const rows=filter(sql,params,state[table]);
      state[table]=state[table].filter(row=>!rows.includes(row));
      return [{affectedRows:rows.length}];
    }
    throw new Error('Unexpected fake database query.');
  }
  async function query(sql,params=[]) {
    const [rows]=await execute(sql,params);
    if (sql.includes('LIMIT ? OFFSET ?')) return [rows.slice(params.at(-1),params.at(-1)+params.at(-2))];
    return [rows];
  }
  const connection={execute,query,async beginTransaction(){},async commit(){},async rollback(){rolledBack=true;},release(){}};
  return {state,calls,execute,query,async getConnection(){return connection;},get rolledBack(){return rolledBack;}};
}
