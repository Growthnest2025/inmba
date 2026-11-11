// INMBA: offline-only MySQL dump -> D1 staging INSERT converter.
// Run inside backend; does not connect to network, MySQL, or Cloudflare.
// Never commit generated SQL or MySQL dump to source control.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const source = process.argv[2];
const schema = process.argv[3];
const output = process.argv[4];
if (!source || !schema || !output) {
  console.error('Usage: node inmba_prepare_d1_import.cjs <mysql-export.sql> <d1-schema-v2.sql> <output.sql>');
  process.exit(1);
}
if (path.resolve(output) === path.resolve(source) || path.resolve(output) === path.resolve(schema)) throw Error('Output path must not overwrite input');
const dump = fs.readFileSync(source, 'utf8');
const db = new DatabaseSync(':memory:');
db.exec(fs.readFileSync(schema, 'utf8'));
const targetTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(x => x.name);
const targetColumns = Object.fromEntries(targetTables.map(t => [t, db.prepare(`PRAGMA table_info("${t}")`).all().map(x => x.name)]));
const sourceColumns = {};
for (const m of dump.matchAll(/CREATE TABLE\s+`([^`]+)`\s*\(([\s\S]*?)\)\s*ENGINE=/g)) {
  sourceColumns[m[1]] = [...m[2].matchAll(/^\s*`([^`]+)`\s/mg)].map(x=>x[1]);
}
if (!sourceColumns.kyc_members || sourceColumns.kyc_members.length !== 253) throw Error('Expected original 253-column kyc_members schema');
const sqlValue = v => {
 if (v === null) return 'NULL';
 if (typeof v === 'number') return String(v);
 if (/\u0000/.test(v)) return `CAST(X'${Buffer.from(v,'utf8').toString('hex')}' AS TEXT)`;
 return "'"+String(v).replace(/'/g,"''")+"'";
};
function readRows(src) {
 let i=0; const rows=[];
 const whitespace=()=>{while(/\s/.test(src[i]||'')&&i<src.length)i++};
 const string=()=>{let a=''; i++;let done=false;
  while(i<src.length){let c=src[i++];if(c==="'"){done=true;break;}if(c==='\\'){
   if (i>=src.length) throw Error('Truncated MySQL escape');
   const x=src[i++]; const map={ '0':'\0','b':'\b','n':'\n','r':'\r','t':'\t','Z':'\x1a',"'":"'",'"':'"','\\':'\\'};
   a+=Object.prototype.hasOwnProperty.call(map,x)?map[x]:x;
  } else a+=c;}
  if(!done)throw Error('Unterminated MySQL string');return a;
 };
 while(true){whitespace();if(i>=src.length||src[i]===';')break;
  if(src[i]!== '(')throw Error('Expected row opening parenthesis at '+i); i++;let row=[];
  while(true){whitespace();let value;
   if(src[i]==="'")value=string();
   else {let start=i; while(i<src.length&&!/[,)]/.test(src[i])) i++;const raw=src.slice(start,i).trim();
    if(!raw)throw Error('Empty raw value');
    if(/^NULL$/i.test(raw))value=null;
    else if(/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(raw))value=raw;
    else if(/^0x[0-9a-f]+$/i.test(raw))value=Buffer.from(raw.slice(2),'hex').toString('utf8');
    else throw Error('Unsupported MySQL value (not exposed for privacy)');
   }
   row.push(value);whitespace();
   if(src[i]===','){i++;continue;}
   if(src[i]===')'){i++;break;}
   throw Error('Unexpected row delimiter at '+i);
  }
  rows.push(row);whitespace();if(src[i]===','){i++;continue;}if(src[i]===';'||i>=src.length)break;
  throw Error('Unexpected row separator at '+i);
 }
 return rows;
}
let statements=[];let counts={};let mappedColumns={};
for (const match of dump.matchAll(/^INSERT INTO `([^`]+)`(?:\s*\(([^)]*)\))?\s+VALUES\s+([\s\S]*?);\s*$/gm)) {
 const table=match[1], header=match[2];
 if (!sourceColumns[table]) throw Error('Missing source schema for '+table);
 if (!targetColumns[table]) throw Error('Missing D1 table '+table);
 let cols = header ? [...header.matchAll(/`([^`]+)`/g)].map(x=>x[1]) : sourceColumns[table];
 if (!cols.length)throw Error('No columns parsed '+table);
 const rows=readRows(match[3]);
 for (const row of rows){
  if (row.length !== cols.length)throw Error('Column/value mismatch: '+table+' expected '+cols.length+' got '+row.length);
  const record = Object.fromEntries(cols.map((c,j)=>[c,row[j]]));
  if(table==='inmba_sessions'){counts[table]=(counts[table]||0)+1;continue;} // Discard old web sessions intentionally.
  const destinations=table==='kyc_members'?['kyc_members','kyc_members_ext_1','kyc_members_ext_2']:[table];
  for (const dest of destinations) {
   const names=targetColumns[dest].filter(c => c==='member_id' && dest!=='table' && table==='kyc_members' || Object.hasOwn(record,c));
   const effective = names.map(c=>c==='member_id'&&dest.startsWith('kyc_members_ext_')?'id':c);
   if(!names.length)throw Error('No matching columns for '+dest);
   const vals = effective.map(c=>sqlValue(record[c]));
   statements.push(`INSERT INTO "${dest}" (${names.map(x=>'"'+x+'"').join(',')}) VALUES (${vals.join(',')});`);
  }
  counts[table]=(counts[table]||0)+1;
 }
 mappedColumns[table]=cols;
}
if (counts.kyc_members!==64) throw Error('Expected exactly 64 members; found '+(counts.kyc_members||0)+'. No file written.');
for (const [table,cols] of Object.entries(mappedColumns)){
 const all=table==='kyc_members'?new Set(['kyc_members','kyc_members_ext_1','kyc_members_ext_2'].flatMap(t=>targetColumns[t])):new Set(targetColumns[table]);
 const missing=cols.filter(c=>!all.has(c));
 if(missing.length)throw Error('Unmapped source columns in '+table+': '+missing.join(','));
}
// Local verification: run all INSERTs transactionally, validate relationships and 64 rows.
db.exec('BEGIN TRANSACTION;');
try{for(const sql of statements)db.exec(sql); db.exec('COMMIT;');}catch(e){db.exec('ROLLBACK;');throw Error('Local SQLite validation failed: '+e.message);}
for(const t of ['kyc_members','kyc_members_ext_1','kyc_members_ext_2']){
 const n=db.prepare(`SELECT count(*) AS n FROM "${t}"`).get().n;
 if(n!==64)throw Error('Invalid row count in '+t+': '+n);
}
const chk=db.prepare('PRAGMA foreign_key_check').all();if(chk.length)throw Error('Foreign key violations: '+chk.length);
// No explicit BEGIN because Wrangler imports via its own transaction.
const banner='-- STAGING ONLY. Contains private member, admin, and KYC data. Never commit, upload to chat, or send to production.\n-- Does not include original inmba_sessions (expired local server sessions should not transfer).\n';
fs.writeFileSync(output,banner+statements.join('\n')+'\n',{encoding:'utf8',flag:'wx',mode:0o600});
console.log('Local conversion and SQLite validation PASS.');
console.log('Members: 64; split extension rows: 64 + 64.');
console.log('Tables with original records: '+Object.entries(counts).map(([t,n])=>t+'='+n).join(', '));
console.log('Private staging SQL saved locally; do not share its contents.');
