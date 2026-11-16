import { chromium } from 'playwright-core';
import { createApp } from '../server.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const received=[];
process.env.ARTIFACT_DIR ||= '/tmp';
const server=createApp({config:{mode:'openai',base:'https://mock.invalid/v1',model:'MOCK TEST MODEL',ready:true,key:'',token:''},fetchImpl:async(_u,o)=>{received.push(JSON.parse(o.body));return new Response('data: {"choices":[{"delta":{"content":"Mock test reply: I will keep your Banglish preference in mind."}}]}\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:720},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByRole('button',{name:'Continue as Guest'}).click();await page.waitForTimeout(1000);
 await page.screenshot({path:process.env.ARTIFACT_DIR + '/karishma-exact-chat.png',fullPage:true});
 await page.locator('nav button').filter({hasText:/^Memory$/}).first().click();await page.waitForTimeout(800);await page.screenshot({path:process.env.ARTIFACT_DIR + '/karishma-exact-memory.png',fullPage:true});
 await page.locator('.mp-c').filter({hasText:'Preferences'}).click();await page.getByLabel('Memory note',{exact:true}).fill('I prefer Banglish and short answers.');await page.getByRole('button',{name:'Save note',exact:true}).click();await page.screenshot({path:process.env.ARTIFACT_DIR + '/karishma-exact-memory-editor.png',fullPage:true});
 assert.equal(await page.locator('[role=dialog]').getByText('I prefer Banglish and short answers.',{exact:true}).count(),1);
 await page.getByRole('button',{name:'Close memory editor'}).click();await page.locator('nav button').filter({hasText:/^Chat$/}).first().click();await page.getByRole('textbox',{name:'Message',exact:true}).fill('Hi, what do you know about my preferences?');await page.getByRole('button',{name:'Send',exact:true}).click();
 await page.getByText('Mock test reply: I will keep your Banglish preference in mind.',{exact:true}).waitFor();assert.match(received[0].messages[0].content,/I prefer Banglish and short answers/);await page.screenshot({path:process.env.ARTIFACT_DIR + '/karishma-exact-ai-test.png',fullPage:true});
 await page.reload();await page.getByText('Mock test reply: I will keep your Banglish preference in mind.',{exact:true}).waitFor();
 await page.locator('nav button').filter({hasText:/^Memory$/}).first().click();await page.getByLabel('Toggle memory').click();
 await page.locator('nav button').filter({hasText:/^Chat$/}).first().click();await page.getByRole('textbox',{name:'Message',exact:true}).fill('Second test, memory off.');await page.getByRole('button',{name:'Send',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('button[aria-label="Stop Generation"]'));assert.equal(received.length,2);assert.doesNotMatch(received[1].messages[0].content,/I prefer Banglish and short answers/);
 await page.locator('nav button').filter({hasText:/^Memory$/}).first().click();await page.locator('.mp-c').filter({hasText:'Preferences'}).click();await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Memory note',{exact:true}).fill('I prefer Bengali.');await page.getByRole('button',{name:'Update note',exact:true}).click();assert.equal(await page.locator('[role=dialog]').getByText('I prefer Bengali.',{exact:true}).count(),1);
 await page.getByRole('button',{name:'Remove',exact:true}).click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('karishma_mvp_memory_notes'))),[]);
 await page.getByLabel('Memory note',{exact:true}).fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Save note',exact:true}).click();assert.equal(await page.locator('[role=dialog] img').count(),0);await page.getByRole('button',{name:'Close memory editor'}).click();
 await page.locator('nav button').filter({hasText:/^Settings$/}).first().click();
 const downloadWait=page.waitForEvent('download');await page.getByRole('button',{name:'Export Browser Data (.json)',exact:true}).click();const dl=await downloadWait;const exported=JSON.parse(await fs.readFile(await dl.path(),'utf8'));assert.equal(exported.chats.length,1);assert.equal(exported.memory.length,1);assert.match(exported.storage,/not encrypted/);
 await page.getByRole('button',{name:'Shred Chats & Clear Memory',exact:true}).click();await page.getByRole('button',{name:'Yes, Wipe Cache',exact:true}).click();
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k==='karishma_mvp_memory_notes'||k.startsWith('karishma_mvp_history_'))),false);
 await page.reload();await page.locator('nav button').filter({hasText:/^Memory$/}).first().click();await page.locator('.mp-c').filter({hasText:'Conversations'}).click();await page.getByRole('heading',{name:'No Past Chats',exact:true}).waitFor();
 // Close the original history panel by clicking its backdrop outside the drawer.
 await page.locator('h2').filter({hasText:'Chat History'}).locator('../..').locator('button').last().click();
 await page.locator('nav button').filter({hasText:/^Memory$/}).first().click();await page.locator('.mp-c').filter({hasText:'Preferences'}).click();assert.equal(await page.locator('[role=dialog] .mvp-memory-entry').count(),0);await page.getByRole('button',{name:'Close memory editor'}).click();
 await page.locator('nav button').filter({hasText:/^Settings$/}).first().click();await page.getByRole('radio').nth(1).check();await page.getByRole('button',{name:'Close settings',exact:true}).click();
 await page.locator('nav button').filter({hasText:/^Chat$/}).first().click();await page.getByRole('textbox',{name:'Message',exact:true}).fill('This session should not persist.');await page.getByRole('button',{name:'Send',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('button[aria-label="Stop Generation"]'));await page.getByText('Mock test reply: I will keep your Banglish preference in mind.',{exact:true}).waitFor();
 await page.reload();await page.waitForTimeout(300);assert.equal(await page.getByText('This session should not persist.',{exact:true}).count(),0);
 await page.locator('nav button').filter({hasText:/^Memory$/}).first().click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await page.screenshot({path:process.env.ARTIFACT_DIR + '/karishma-exact-mobile.png',fullPage:true});console.log('MOBILE',await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',checks:['original-source frontend mounted','guest path','create/edit/delete memory','memory in upstream request','memory-off exclusion','chat reload persistence','HTML injection escaped','JSON export without false encryption claim','clear removes chats and notes, stays clear after reload','session-only history not restored on reload','no browser JS errors'],ai:'mocked transport only, no real model verified'},null,2));
}catch(e){await page.screenshot({path:process.env.ARTIFACT_DIR + '/karishma-rebase-failure.png',fullPage:true});console.log('BODY',await page.locator('body').innerText());console.log('ERRORS',errors);throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
