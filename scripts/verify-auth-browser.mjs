import { chromium } from 'playwright-core';
import { createApp } from '../server.mjs';
import assert from 'node:assert/strict';
const server = createApp({config:{mode:'openai',base:'https://mock.invalid/v1',model:'MOCK',ready:true,key:'',token:'',googleClientId:'local-test-client',sessionSecret:'local-test-secret-not-a-real-credential'},fetchImpl:async(url,o)=>{
 if(url.includes('tokeninfo'))return Response.json({aud:'local-test-client',sub:'local-test-user',expires_in:3600});
 if(url.includes('userinfo'))return Response.json({sub:'local-test-user',email:'local-test@example.invalid',email_verified:true,name:'Local Test',given_name:'Local'});
 return new Response('data: {"choices":[{"delta":{"content":"Local mock reply."}}]}\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const origin=`http://127.0.0.1:${server.address().port}`;const errors=[];page.on('pageerror',e=>errors.push(e.message));
await context.route('https://accounts.google.com/gsi/client',r=>r.fulfill({contentType:'application/javascript',body:'window.google={accounts:{oauth2:{initTokenClient:opts=>({requestAccessToken:()=>opts.callback({access_token:"local-only-mock-token"})})}}};'}));
const signIn=async()=>{await page.getByRole('button',{name:'Google',exact:true}).click();await page.getByRole('button',{name:'New Chat',exact:true}).waitFor();};
const signOut=async()=>{await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign Out',exact:true}).click();await page.getByRole('button',{name:'Confirm Sign Out',exact:true}).click();await page.getByRole('heading',{name:'Welcome Back! 💜'}).waitFor();};
try{
 await page.goto(origin);await page.getByRole('button',{name:'Continue as Guest'}).click();
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Guest history stays private');await page.getByRole('button',{name:'Send',exact:true}).click();await page.getByText('Local mock reply.',{exact:true}).waitFor();
 // Start auth screen without deleting guest storage.
 await page.evaluate(()=>{localStorage.removeItem('auth_step_completed');localStorage.removeItem('best_friend_is_guest');});await page.reload();
 await signIn();assert.equal(await page.getByText('Guest history stays private',{exact:true}).count(),0);
 const cookies=await context.cookies();const cookie=cookies.find(c=>c.name==='karishma_session');assert.ok(cookie?.httpOnly);assert.equal(cookie.sameSite,'Lax');assert.ok(cookie.expires>Date.now()/1000+29*86400);
 assert.equal(await page.evaluate(()=>JSON.stringify(localStorage).includes('local-only-mock-token')),false);
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Account history survives logout');await page.getByRole('button',{name:'Send',exact:true}).click();await page.getByText('Local mock reply.',{exact:true}).waitFor();
 await page.reload();await page.getByRole('main').getByText('Account history survives logout',{exact:true}).waitFor();
 await page.screenshot({path:'/tmp/karishma-auth-mobile.png',fullPage:true});
 await signOut();await page.reload();await page.getByRole('heading',{name:'Welcome Back! 💜'}).waitFor();
 await page.getByRole('button',{name:'Sign up',exact:true}).click();await signIn();await page.getByRole('main').getByText('Account history survives logout',{exact:true}).waitFor();
 // A corrupted cookie must never restore the cached profile as signed in.
 await context.addCookies([{name:'karishma_session',value:'tampered.invalid',url:origin}]);await page.reload();await page.getByRole('heading',{name:'Welcome Back! 💜'}).waitFor();
 await page.getByRole('button',{name:'Continue as Guest'}).click();await page.getByRole('main').getByText('Guest history stays private',{exact:true}).waitFor();assert.equal(await page.getByText('Account history survives logout',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: Login + Sign Up exchange verified mock Google identity for HttpOnly persistent cookie; reload restores account history; logout persists; guest/account histories isolated; tampered cookie rejected; mobile no JS errors. Mock transport only, not live Google proof.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
