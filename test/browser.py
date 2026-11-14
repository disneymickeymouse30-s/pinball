import asyncio, sys, json
from playwright.async_api import async_playwright
URL='http://localhost:8765/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]
        pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None)
        pg.on('pageerror',lambda e: errs.append('PAGEERROR '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/shots/01_title.png')
        await pg.tap('[data-act=start]'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='test/shots/02_tutorial0.png')
        # tutorial: left, right, both, launch
        await pg.touchscreen.tap(90,600); await pg.wait_for_timeout(400)
        await pg.touchscreen.tap(300,600); await pg.wait_for_timeout(400)
        st=await pg.evaluate('PP_TEST.rend.tut&&PP_TEST.rend.tut.step'); print('tut step after L,R:',st)
        # both simultaneously via CDP
        cdp=await ctx.new_cdp_session(pg)
        await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':90,'y':600,'id':1},{'x':300,'y':600,'id':2}]})
        await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/shots/03_both.png')
        await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        await pg.wait_for_timeout(300)
        st=await pg.evaluate('PP_TEST.rend.tut&&PP_TEST.rend.tut.step'); print('tut step after both:',st)
        await pg.screenshot(path='test/shots/04_launchready.png')
        # launch: find button screen pos
        pos=await pg.evaluate('(()=>{const r=PP_TEST.rend;return {x:r.ox+371*r.sc,y:r.oy+(46+630)*r.sc}})()')
        await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':pos['x'],'y':pos['y'],'id':1}]})
        await pg.wait_for_timeout(500); await pg.screenshot(path='test/shots/05_charge.png')
        await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        await pg.wait_for_timeout(700)
        print('phase',await pg.evaluate('PP_TEST.App.g.phase'),'tutDone',await pg.evaluate('PP.Save.data.tutorialDone'))
        # autoplay bot inside page
        await pg.evaluate('''window.__bot=setInterval(()=>{const g=PP_TEST.App.g;if(!g||g.over||PP_TEST.App.paused)return;if(g.phase==='ready'&&!g.locked)g.launch(0.8);for(let i=0;i<2;i++){let w=false;for(const b of g.balls){if(b.held||b.inShooter)continue;const inX=i===0?(b.x>95&&b.x<185):(b.x>185&&b.x<275);if(inX&&b.y>605&&b.y<672&&b.vy>-150)w=true;}g.setFlip(i,w&&(Date.now()%450<170));}},16)''')
        for i in range(4):
            await pg.wait_for_timeout(2500); await pg.screenshot(path=f'test/shots/06_play{i}.png')
        print('score',await pg.evaluate('PP_TEST.App.g.score'),'fps-ish ok')
        # pause via HUD button
        pp=await pg.evaluate('(()=>{const r=PP_TEST.rend;return {x:r.ox+374*r.sc,y:r.oy+23*r.sc}})()')
        await pg.touchscreen.tap(pp['x'],pp['y']); await pg.wait_for_timeout(400); await pg.screenshot(path='test/shots/07_pause.png')
        print('paused',await pg.evaluate('PP_TEST.App.paused'))
        await pg.tap('[data-act=quit]'); await pg.wait_for_timeout(600); await pg.screenshot(path='test/shots/08_result.png')
        await pg.tap('#s-result [data-v=stages]'); await pg.wait_for_timeout(500); await pg.screenshot(path='test/shots/09_stages.png',full_page=False)
        await pg.evaluate("PP.Save.data.bow=5000;PP.UI.show('collection')"); await pg.wait_for_timeout(300); await pg.screenshot(path='test/shots/10_collection.png')
        await pg.evaluate("PP.UI.tab='custom';PP.UI.show('collection')"); await pg.wait_for_timeout(300); await pg.screenshot(path='test/shots/11_custom.png')
        for n in ['ach','records','settings']:
            await pg.evaluate(f"PP.UI.show('{n}')"); await pg.wait_for_timeout(300); await pg.screenshot(path=f'test/shots/12_{n}.png')
        # every stage: start, run bot 6s, screenshot
        await pg.evaluate("PP.Save.data.unlocked=[1,2,3,4,5,6,7,8,9,10,11]")
        for sid in range(1,12):
            await pg.evaluate(f"PP_TEST.App.start({sid})"); await pg.wait_for_timeout(5000)
            await pg.screenshot(path=f'test/shots/s{sid:02d}.png')
            print('stage',sid,'score',await pg.evaluate('PP_TEST.App.g.score'),'balls',await pg.evaluate('PP_TEST.App.g.balls.length'))
            await pg.evaluate("PP_TEST.App.finish(false)")
        sw=await pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!r)"); print('sw registered',sw)
        print('save',await pg.evaluate("JSON.stringify({plays:PP.Save.data.plays,bow:PP.Save.data.bow,lv:PP.Save.data.level,ach:Object.keys(PP.Save.data.ach).length,ls:!!localStorage.getItem('pugPinballWorld.save')})"))
        print('ERRORS',len(errs)); [print('  ',e[:300]) for e in errs[:15]]
        await b.close()
asyncio.run(main())
